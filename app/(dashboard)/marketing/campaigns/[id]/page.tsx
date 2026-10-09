"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft, Loader2, Users, Send, CheckCheck, Eye,
    AlertCircle, MessageCircle, Download, Trash2, Megaphone,
    Play, Pause, XCircle, RotateCcw, Copy, Coins, Calendar,
    Search, AlertTriangle, ShieldCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
    useGetCampaign,
    useGetCampaignAnalytics,
    useGetCampaignRecipients,
    useLaunchCampaign,
    usePauseCampaign,
    useResumeCampaign,
    useCancelCampaign,
    useRetryCampaignFailed,
    useDuplicateCampaign,
    useDeleteCampaign,
    useGetCampaignPreflight,
    CampaignRecipient,
} from "@/lib/api-client-react";
import { CampaignPreflightModal, CampaignPreflightWidget } from "@/components/campaigns";
import { useRealtimeCampaign } from "@/lib/realtime-campaign";
import { useQueryClient } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────
// Status Badge Helpers
// ─────────────────────────────────────────────────────────

const CAMPAIGN_STATUS: Record<string, { label: string; classes: string; pulse?: boolean }> = {
    draft: { label: "Draft", classes: "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" },
    validating: { label: "Validating", classes: "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-300", pulse: true },
    ready: { label: "Ready", classes: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    scheduled: { label: "Scheduled", classes: "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    queued: { label: "Queued", classes: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300", pulse: true },
    running: { label: "Running", classes: "border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-600 dark:bg-teal-950 dark:text-teal-300", pulse: true },
    sending: { label: "Running", classes: "border-teal-400 bg-teal-50 text-teal-800 dark:border-teal-600 dark:bg-teal-950 dark:text-teal-300", pulse: true },
    paused: { label: "Paused", classes: "border-yellow-400 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
    completed: { label: "Completed", classes: "border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    partially_completed: { label: "Partial", classes: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    failed: { label: "Failed", classes: "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300" },
    cancelled: { label: "Cancelled", classes: "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400" },
};

const RECIPIENT_STATUS: Record<string, { label: string; classes: string }> = {
    pending: { label: "Pending", classes: "border-zinc-300 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400" },
    validating: { label: "Validating", classes: "border-sky-300 bg-sky-50 text-sky-700" },
    queued: { label: "Queued", classes: "border-amber-300 bg-amber-50 text-amber-700" },
    sending: { label: "Sending", classes: "border-teal-300 bg-teal-50 text-teal-700" },
    sent: { label: "Sent", classes: "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-400" },
    delivered: { label: "Delivered", classes: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    read: { label: "Read", classes: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400" },
    failed: { label: "Failed", classes: "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400" },
    skipped: { label: "Skipped", classes: "border-slate-300 bg-slate-50 text-slate-600" },
    cancelled: { label: "Cancelled", classes: "border-slate-300 bg-slate-50 text-slate-600" },
};

function StatusBadge({ status }: { status: string }) {
    const s = CAMPAIGN_STATUS[status?.toLowerCase()] ?? CAMPAIGN_STATUS.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${s.classes}`}>
            {s.pulse && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
                </span>
            )}
            {s.label}
        </span>
    );
}

function RecipientBadge({ status }: { status: string }) {
    const s = RECIPIENT_STATUS[status?.toLowerCase()] ?? RECIPIENT_STATUS.pending;
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${s.classes}`}>
            {s.label}
        </span>
    );
}

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Subscribe to Pusher realtime campaign events
    useRealtimeCampaign(id);

    // Filters & Pagination for Recipient Table
    const [recipientStatus, setRecipientStatus] = useState("all");
    const [recipientSearch, setRecipientSearch] = useState("");
    const [page, setPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showPreflightModal, setShowPreflightModal] = useState(false);

    // Queries
    const { data, isLoading, error } = useGetCampaign(id);
    const { data: analytics } = useGetCampaignAnalytics(id);
    const { data: recipientsData, isLoading: isLoadingRecipients } = useGetCampaignRecipients(id, {
        status: recipientStatus !== "all" ? recipientStatus : undefined,
        search: recipientSearch.trim() ? recipientSearch.trim() : undefined,
        page,
        per_page: 25,
    });

    // Preflight query for inline draft status
    const { data: preflightData, refetch: refetchPreflight } = useGetCampaignPreflight(id, {
        enabled: Boolean(id),
    });

    // Mutations
    const launchMutation = useLaunchCampaign();
    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();
    const cancelMutation = useCancelCampaign();
    const retryMutation = useRetryCampaignFailed();
    const duplicateMutation = useDuplicateCampaign();
    const deleteMutation = useDeleteCampaign();

    const campaign = data?.campaign;

    // Actions
    function handleLaunch() {
        if (!campaign) return;
        // Open preflight audit modal to verify 12-point readiness before launching
        setShowPreflightModal(true);
    }

    async function handleConfirmLaunch() {
        if (!campaign) return;
        try {
            await launchMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign launched into batch processing!");
            setShowPreflightModal(false);
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
            queryClient.invalidateQueries({ queryKey: ["campaignPreflight", id] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to launch campaign");
        }
    }

    async function handlePause() {
        if (!campaign) return;
        try {
            await pauseMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign execution paused");
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to pause campaign");
        }
    }

    async function handleResume() {
        if (!campaign) return;
        try {
            await resumeMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign execution resumed");
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to resume campaign");
        }
    }

    async function handleCancel() {
        if (!campaign) return;
        try {
            await cancelMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign cancelled and unused credits released");
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to cancel campaign");
        }
    }

    async function handleRetryFailed() {
        if (!campaign) return;
        try {
            await retryMutation.mutateAsync({ id: campaign.id });
            toast.success("Failed recipients re-queued for dispatch!");
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
            queryClient.invalidateQueries({ queryKey: ["campaignRecipients", id] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to retry campaign");
        }
    }

    async function handleDuplicate() {
        if (!campaign) return;
        try {
            const copy = await duplicateMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign duplicated as new draft");
            router.push(`/marketing/campaigns/${copy.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to duplicate campaign");
        }
    }

    async function handleDelete() {
        if (!campaign) return;
        try {
            await deleteMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign removed");
            router.push("/marketing/campaigns");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
        }
    }

    function handleExportCsv() {
        if (!campaign) return;
        // Direct stream download from backend API
        window.open(`/api/campaigns/${campaign.id}/export`, "_blank");
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#2F8F83]" />
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
                <p className="text-sm text-destructive">{error instanceof Error ? error.message : "Campaign not found"}</p>
                <Button variant="outline" onClick={() => router.push("/marketing/campaigns")}>
                    Back to Campaigns
                </Button>
            </div>
        );
    }

    const total = campaign.eligible_recipients > 0 ? campaign.eligible_recipients : campaign.total_recipients;
    const isRunning = campaign.status === "running" || campaign.status === "queued" || (campaign.status as string) === "sending";
    const isPaused = campaign.status === "paused";
    const isDraft = campaign.status === "draft" || campaign.status === "ready";
    const hasFailed = campaign.failed_count > 0;
    const progressPct = campaign.progress_percentage ?? (total > 0 ? Math.round(((campaign.sent_count + campaign.failed_count) / total) * 100) : 0);

    const recipients = recipientsData?.data ?? [];
    const pagination = recipientsData?.pagination;

    return (
        <div className="space-y-6 w-full pb-12">
            {/* Header */}
            <PageHeader
                icon={Megaphone}
                title={campaign.name}
                description={`WhatsApp Broadcast · Template: ${campaign.template_name || "Custom"} · Created ${new Date(campaign.created_at).toLocaleDateString()}`}
                breadcrumbs={[
                    { label: "Engagement" },
                    { label: "Campaigns", href: "/marketing/campaigns" },
                    { label: campaign.name },
                ]}
                badge={CAMPAIGN_STATUS[campaign.status]?.label}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Draft Launch & Preflight */}
                        {isDraft && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowPreflightModal(true)}
                                    className="text-xs h-9 px-3 gap-1.5"
                                >
                                    <ShieldCheck className="h-4 w-4 text-[#2F8F83]" />
                                    <span>Preflight Audit</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleLaunch}
                                    disabled={launchMutation.isPending}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-9 px-4 font-semibold shadow-xs"
                                >
                                    {launchMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                                    Launch Campaign
                                </Button>
                            </>
                        )}

                        {/* Running controls: Pause & Cancel */}
                        {isRunning && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handlePause}
                                    disabled={pauseMutation.isPending}
                                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 text-xs h-9 px-3"
                                >
                                    <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={cancelMutation.isPending}
                                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-9 px-3"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                                </Button>
                            </>
                        )}

                        {/* Paused controls: Resume & Cancel */}
                        {isPaused && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={handleResume}
                                    disabled={resumeMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-3.5"
                                >
                                    <Play className="h-3.5 w-3.5 mr-1" /> Resume
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={cancelMutation.isPending}
                                    className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-9 px-3"
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                                </Button>
                            </>
                        )}

                        {/* Retry Failed */}
                        {hasFailed && !isRunning && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRetryFailed}
                                disabled={retryMutation.isPending}
                                className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs h-9 px-3"
                            >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Retry Failed ({campaign.failed_count})
                            </Button>
                        )}

                        {/* Duplicate */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDuplicate}
                            disabled={duplicateMutation.isPending}
                            className="text-xs h-9 px-3"
                        >
                            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                        </Button>

                        {/* Export CSV */}
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportCsv}
                            className="text-xs h-9 px-3"
                        >
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>

                        {/* Delete (if confirm) */}
                        {confirmDelete ? (
                            <div className="flex items-center gap-1.5 p-1 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg">
                                <span className="text-[11px] font-semibold text-red-700 px-1">Confirm delete?</span>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmDelete(false)}>No</Button>
                                <Button size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Yes</Button>
                            </div>
                        ) : (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDelete(true)}
                                disabled={isRunning}
                                className="text-muted-foreground hover:text-red-600 text-xs h-9 px-2"
                                title="Delete campaign"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Live Progress Card (if Running or in-flight) */}
            {(isRunning || isPaused || progressPct > 0) && (
                <Card className="shadow-2xs border-[#2F8F83]/30 bg-gradient-to-r from-teal-50/40 via-card to-card dark:from-teal-950/20">
                    <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <StatusBadge status={campaign.status} />
                                <span className="text-xs font-bold text-foreground">
                                    {isPaused ? "Campaign Paused" : isRunning ? "Broadcasting in Batches..." : "Delivery Complete"}
                                </span>
                            </div>
                            <span className="text-sm font-bold tabular-nums text-[#2F8F83]">
                                {progressPct}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    isPaused ? "bg-yellow-500" : "bg-[#2F8F83]"
                                }`}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>
                                Processed:{" "}
                                <strong className="text-foreground">
                                    {(campaign.sent_count + campaign.failed_count).toLocaleString()}
                                </strong>{" "}
                                / {total.toLocaleString()} recipients
                            </span>
                            <div className="flex items-center gap-4">
                                <span>Sent: <strong className="text-foreground">{campaign.sent_count.toLocaleString()}</strong></span>
                                <span>Delivered: <strong className="text-emerald-600">{campaign.delivered_count.toLocaleString()}</strong></span>
                                <span>Failed: <strong className="text-red-600">{campaign.failed_count.toLocaleString()}</strong></span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Audience</span>
                    <span className="text-xl font-bold text-foreground mt-1 block">{total.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Frozen snapshot</span>
                </Card>

                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Submitted</span>
                    <span className="text-xl font-bold text-foreground mt-1 block">{campaign.sent_count.toLocaleString()}</span>
                    <span className="text-[10px] text-teal-600 mt-0.5 block">Dispatched to Meta</span>
                </Card>

                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Delivered</span>
                    <span className="text-xl font-bold text-emerald-600 mt-1 block">{campaign.delivered_count.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {campaign.delivery_rate !== undefined ? `${campaign.delivery_rate}% rate` : "—"}
                    </span>
                </Card>

                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Read</span>
                    <span className="text-xl font-bold text-blue-600 mt-1 block">{campaign.read_count.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {campaign.read_rate !== undefined ? `${campaign.read_rate}% opened` : "—"}
                    </span>
                </Card>

                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Failed</span>
                    <span className="text-xl font-bold text-red-600 mt-1 block">{campaign.failed_count.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">Delivery errors</span>
                </Card>

                <Card className="shadow-2xs border-border/80 p-4">
                    <span className="text-[11px] text-muted-foreground block font-medium">Credits Billed</span>
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        {(campaign.credits_consumed ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {(campaign.credits_reserved ?? 0).toLocaleString()} reserved
                    </span>
                </Card>
            </div>

            {/* Delivery Funnel & Failure Breakdown */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Funnel */}
                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="text-sm font-bold">Delivery Funnel</CardTitle>
                            <CardDescription className="text-xs">Outbound conversion from audience to read</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-2 space-y-3">
                            {[
                                { label: "Audience", val: analytics.eligible_recipients || total, color: "bg-slate-500" },
                                { label: "Sent", val: analytics.sent_count, color: "bg-[#2F8F83]" },
                                { label: "Delivered", val: analytics.delivered_count, color: "bg-emerald-500" },
                                { label: "Read", val: analytics.read_count, color: "bg-blue-500" },
                            ].map((step) => {
                                const base = Math.max(1, analytics.eligible_recipients || total);
                                const pct = Math.min(100, Math.round((step.val / base) * 100));
                                return (
                                    <div key={step.label} className="space-y-1 text-xs">
                                        <div className="flex justify-between font-semibold">
                                            <span>{step.label}</span>
                                            <span>{step.val.toLocaleString()} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${step.color} rounded-full`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Failure Breakdown */}
                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="text-sm font-bold">Delivery Failures Breakdown</CardTitle>
                            <CardDescription className="text-xs">Errors returned by Meta Cloud API</CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            {Object.keys(analytics.error_breakdown || {}).length === 0 ? (
                                <div className="flex h-32 flex-col items-center justify-center text-center text-muted-foreground text-xs">
                                    <CheckCheck className="h-6 w-6 text-emerald-500 mb-1" />
                                    <p className="font-semibold text-foreground">Zero Failures</p>
                                    <p className="text-[11px] mt-0.5">All sent messages processed cleanly.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {Object.entries(analytics.error_breakdown).map(([errCode, cnt]) => (
                                        <div key={errCode} className="flex justify-between p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 text-xs">
                                            <span className="font-mono text-red-700 dark:text-red-400 truncate max-w-[220px]">
                                                {errCode}
                                            </span>
                                            <span className="font-bold text-red-600">{cnt} recipient(s)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Paginated Campaign Recipients Table */}
            <Card className="shadow-2xs border-border/80">
                <CardHeader className="p-4 sm:p-5 border-b border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-semibold">Campaign Recipients</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                Server-side paginated list of frozen recipients and delivery timestamps.
                            </CardDescription>
                        </div>

                        {/* Search & Status Filters */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-full sm:w-56">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search recipient or phone..."
                                    value={recipientSearch}
                                    onChange={(e) => {
                                        setRecipientSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 pl-8 text-xs bg-background"
                                />
                            </div>

                            <Select
                                value={recipientStatus}
                                onValueChange={(val) => {
                                    setRecipientStatus(val);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs w-[130px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                    <SelectItem value="read">Read</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoadingRecipients ? (
                        <div className="flex h-48 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-[#2F8F83]" />
                        </div>
                    ) : recipients.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center text-center p-4">
                            <Users className="h-8 w-8 text-muted-foreground mb-1" />
                            <p className="text-xs font-semibold text-foreground">No recipients found</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {recipientSearch || recipientStatus !== "all"
                                    ? "Try adjusting filters."
                                    : "Recipients will appear once the campaign snapshot is frozen."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden md:table-cell">Sent</TableHead>
                                        <TableHead className="hidden lg:table-cell">Delivered</TableHead>
                                        <TableHead className="hidden lg:table-cell">Read</TableHead>
                                        <TableHead>Error / Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipients.map((r) => (
                                        <TableRow key={r.id} className="border-border hover:bg-muted/40">
                                            <TableCell className="font-medium text-xs text-foreground">
                                                {r.name || r.contact_name || "Customer"}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {r.phone || r.phone_number}
                                            </TableCell>
                                            <TableCell>
                                                <RecipientBadge status={r.status} />
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-[11px] text-muted-foreground">
                                                {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : "—"}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground">
                                                {r.delivered_at ? new Date(r.delivered_at).toLocaleTimeString() : "—"}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground">
                                                {r.read_at ? new Date(r.read_at).toLocaleTimeString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-[11px] text-red-500 max-w-[200px] truncate" title={r.error_message || ""}>
                                                {r.error_message || (r.error_code ? `Code: ${r.error_code}` : "—")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination Controls */}
                            {pagination && pagination.last_page > 1 && (
                                <div className="flex items-center justify-between p-3 border-t border-border/60 text-xs text-muted-foreground">
                                    <span>
                                        Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.current_page <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="h-7 w-7 p-0"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.current_page >= pagination.last_page}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="h-7 w-7 p-0"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preflight Verification Modal */}
            {campaign && (
                <CampaignPreflightModal
                    isOpen={showPreflightModal}
                    onClose={() => setShowPreflightModal(false)}
                    campaignId={campaign.id}
                    campaignName={campaign.name}
                    onConfirmLaunch={handleConfirmLaunch}
                    isLaunching={launchMutation.isPending}
                />
            )}
        </div>
    );
}
