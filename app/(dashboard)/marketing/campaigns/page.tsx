"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Megaphone, Send, Percent, Plus, Loader2, Radio,
    Calendar, Users, CheckCheck, AlertCircle, Trash2,
    Mail, MessageSquare, MessageCircle, Play, Pause, XCircle,
    Copy, Eye, Search, Coins, RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UpgradeGuard } from "@/components/upgrade-guard";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    useListCampaigns,
    useGetCampaignStats,
    useDeleteCampaign,
    usePauseCampaign,
    useResumeCampaign,
    useCancelCampaign,
    useDuplicateCampaign,
    Campaign,
    type SavedViewItem,
} from "@/lib/api-client-react";
import { SavedViewsBar } from "@/components/saved-views";
import { useRealtimeCampaign } from "@/lib/realtime-campaign";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────
// Lifecycle Status Mapping
// ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<
    string,
    { label: string; classes: string; pulse?: boolean }
> = {
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

function StatusBadge({ status }: { status: string }) {
    const s = STATUS_MAP[status?.toLowerCase()] ?? STATUS_MAP.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${s.classes}`}>
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

function RateBar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    return (
        <div className="flex items-center gap-2">
            <span className="w-8 text-right text-xs font-semibold tabular-nums text-foreground">{pct}%</span>
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────

export default function CampaignsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Enable realtime websocket updates on workspace channel
    useRealtimeCampaign(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [channelFilter, setChannelFilter] = useState("all");
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    // Saved Views State (TASK 14)
    const [activeViewId, setActiveViewId] = useState<number | null>(null);

    const handleSelectView = (view: SavedViewItem | null) => {
        if (!view) {
            setActiveViewId(null);
            setStatusFilter("all");
            setChannelFilter("all");
        } else {
            setActiveViewId(view.id);
            if (view.filters) {
                if (view.filters.status) setStatusFilter(view.filters.status);
                if (view.filters.channel) setChannelFilter(view.filters.channel);
            }
        }
    };

    const { data: campaigns = [], isLoading, error, refetch } = useListCampaigns({
        status: statusFilter !== "all" ? statusFilter : undefined,
        channel: channelFilter !== "all" ? channelFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        view_id: activeViewId || undefined,
    });

    const { data: stats } = useGetCampaignStats();

    const deleteCampaign = useDeleteCampaign();
    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();
    const cancelMutation = useCancelCampaign();
    const duplicateMutation = useDuplicateCampaign();

    async function handleDelete(id: number) {
        try {
            await deleteCampaign.mutateAsync({ id });
            toast.success("Campaign removed successfully");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
        } finally {
            setConfirmDelete(null);
        }
    }

    async function handlePause(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            await pauseMutation.mutateAsync({ id });
            toast.success("Campaign paused");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to pause campaign");
        }
    }

    async function handleResume(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            await resumeMutation.mutateAsync({ id });
            toast.success("Campaign resumed");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to resume campaign");
        }
    }

    async function handleCancel(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            await cancelMutation.mutateAsync({ id });
            toast.success("Campaign cancelled");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to cancel campaign");
        }
    }

    async function handleDuplicate(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            const copy = await duplicateMutation.mutateAsync({ id });
            toast.success("Campaign duplicated as new draft");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            router.push(`/marketing/campaigns/${copy.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to duplicate campaign");
        }
    }

    // Client-side quick filter fallback if search is fast-typed
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter((c) => {
            if (statusFilter !== "all" && c.status?.toLowerCase() !== statusFilter.toLowerCase()) {
                return false;
            }
            if (channelFilter !== "all" && (c.channel || "whatsapp") !== channelFilter) {
                return false;
            }
            if (search.trim()) {
                const term = search.toLowerCase();
                const matchName = c.name?.toLowerCase().includes(term);
                const matchTpl = c.template_name?.toLowerCase().includes(term);
                if (!matchName && !matchTpl) return false;
            }
            return true;
        });
    }, [campaigns, statusFilter, channelFilter, search]);

    return (
        <UpgradeGuard
            allowedPlans={["business", "enterprise"]}
            featureName="Bulk Campaigns"
            description="Send high-volume WhatsApp broadcast campaigns, target dynamic segments, and monitor live delivery."
        >
            <div className="space-y-6 w-full">
                {/* Page Header */}
                <PageHeader
                    icon={Megaphone}
                    title="Campaigns"
                    description="Design, target, and launch high-volume WhatsApp bulk broadcast campaigns with frozen audience snapshots."
                    breadcrumbs={[{ label: "Engagement" }, { label: "Campaigns" }]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="h-9 px-3 text-xs flex items-center gap-1.5"
                                title="Refresh campaign data"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </Button>
                            <Button
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer font-semibold text-xs h-9 px-4"
                                onClick={() => router.push("/marketing/campaigns/new")}
                            >
                                <Plus className="h-4 w-4" />
                                New Campaign
                            </Button>
                        </div>
                    }
                />

                {/* Real Dynamic Stats Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Total Campaigns</CardTitle>
                            <Megaphone className="h-4 w-4 text-[#2F8F83]" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold tracking-tight text-foreground">{stats?.total_campaigns ?? 0}</div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {stats?.active_campaigns ? `${stats.active_campaigns} in flight` : "Outbound operations"}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Messages Sent</CardTitle>
                            <Send className="h-4 w-4 text-teal-600" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {(stats?.messages_sent ?? 0).toLocaleString()}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {(stats?.delivered ?? 0).toLocaleString()} delivered
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Delivery Rate</CardTitle>
                            <Percent className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold tracking-tight text-emerald-600">
                                {stats?.delivery_rate !== undefined ? `${stats.delivery_rate}%` : "—"}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Verified Meta delivery</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xs border-border/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Read Rate</CardTitle>
                            <CheckCheck className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold tracking-tight text-blue-600">
                                {stats?.read_rate !== undefined ? `${stats.read_rate}%` : "—"}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Recipients opened</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-2xs border-border/80 col-span-2 md:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Credits Used</CardTitle>
                            <Coins className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                {(stats?.credits_used ?? 0).toLocaleString()}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Authoritative billed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Reusable Saved Views Pills (TASK 14) */}
                <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs">
                    <SavedViewsBar
                        entityType="campaigns"
                        activeViewId={activeViewId}
                        onSelectView={handleSelectView}
                        currentFilters={{
                            status: statusFilter,
                            channel: channelFilter,
                            search: search.trim() || undefined,
                        }}
                        hasActiveFilters={statusFilter !== "all" || channelFilter !== "all" || !!search.trim()}
                    />
                </div>

                {/* Broadcast History Container */}
                <Card className="shadow-2xs border-border/80">
                    <CardHeader className="p-4 sm:p-5 border-b border-border/60">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-semibold">Broadcast History</CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                                    Track status, deliverability metrics, and recipients for all bulk campaigns.
                                </CardDescription>
                            </div>

                            {/* Search & Filters */}
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative w-full sm:w-60">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search campaigns..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-8 pl-8 text-xs bg-background"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-8 text-xs w-[130px]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="ready">Ready</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="running">Running</SelectItem>
                                        <SelectItem value="paused">Paused</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={channelFilter} onValueChange={setChannelFilter}>
                                    <SelectTrigger className="h-8 text-xs w-[120px]">
                                        <SelectValue placeholder="All Channels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Channels</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex h-56 items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#2F8F83]" />
                                    <span className="text-xs text-muted-foreground">Loading campaigns...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex h-56 flex-col items-center justify-center gap-3 px-4">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                                <p className="text-sm font-medium text-destructive">Failed to load campaigns</p>
                                <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
                                    Retry
                                </Button>
                            </div>
                        ) : filteredCampaigns.length === 0 ? (
                            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-b-xl px-4 text-center">
                                <div className="h-12 w-12 rounded-full bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#2F8F83]">
                                    <Radio className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {search || statusFilter !== "all" ? "No matching campaigns found" : "No campaigns yet"}
                                    </p>
                                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                        {search || statusFilter !== "all"
                                            ? "Try clearing filters to find what you're looking for."
                                            : "Create your first broadcast campaign to reach your WhatsApp contacts at scale."}
                                    </p>
                                </div>
                                <Button
                                    className="mt-2 bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs h-9 px-4 rounded-xl"
                                    onClick={() => router.push("/marketing/campaigns/new")}
                                >
                                    <Plus className="h-4 w-4 mr-1.5" /> New Campaign
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="w-[280px]">Campaign</TableHead>
                                            <TableHead className="hidden md:table-cell">Channel & Template</TableHead>
                                            <TableHead className="text-right">Recipients</TableHead>
                                            <TableHead className="hidden lg:table-cell">Delivery</TableHead>
                                            <TableHead className="hidden lg:table-cell">Read</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                                            <TableHead className="text-right w-[140px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCampaigns.map((c) => {
                                            const total = c.eligible_recipients > 0 ? c.eligible_recipients : c.total_recipients;
                                            const isRunning = c.status === "running" || (c.status as string) === "sending";
                                            const isPaused = c.status === "paused";

                                            return (
                                                <TableRow
                                                    key={c.id}
                                                    className="cursor-pointer border-border hover:bg-muted/40 transition-colors"
                                                    onClick={() => router.push(`/marketing/campaigns/${c.id}`)}
                                                >
                                                    {/* Campaign Name & Description */}
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-xs text-foreground hover:text-[#2F8F83] transition-colors">
                                                                {c.name}
                                                            </span>
                                                            {c.description && (
                                                                <span className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                                                                    {c.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Channel & Template */}
                                                    <TableCell className="hidden md:table-cell">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                                                                <MessageCircle className="h-3 w-3" />
                                                                {c.template_name || "Custom"}
                                                            </span>
                                                            {c.template_language && (
                                                                <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                                                    {c.template_language}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>

                                                    {/* Recipients Count */}
                                                    <TableCell className="text-right text-xs font-semibold tabular-nums text-foreground">
                                                        {total.toLocaleString()}
                                                    </TableCell>

                                                    {/* Delivery Funnel Bar */}
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-col gap-0.5">
                                                            <RateBar value={c.delivered_count} total={total} color="bg-emerald-500" />
                                                            <span className="text-[10px] text-muted-foreground ml-10">
                                                                {c.delivered_count.toLocaleString()} / {total.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Read Funnel Bar */}
                                                    <TableCell className="hidden lg:table-cell">
                                                        <div className="flex flex-col gap-0.5">
                                                            <RateBar value={c.read_count} total={total} color="bg-blue-500" />
                                                            <span className="text-[10px] text-muted-foreground ml-10">
                                                                {c.read_count.toLocaleString()} / {total.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Status Badge */}
                                                    <TableCell>
                                                        <StatusBadge status={c.status} />
                                                    </TableCell>

                                                    {/* Date */}
                                                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            <span>
                                                                {c.scheduled_at
                                                                    ? new Date(c.scheduled_at).toLocaleDateString()
                                                                    : new Date(c.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            {/* Pause/Resume buttons for running/paused */}
                                                            {isRunning && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                                                    title="Pause campaign"
                                                                    onClick={(e) => handlePause(c.id, e)}
                                                                >
                                                                    <Pause className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {isPaused && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                    title="Resume campaign"
                                                                    onClick={(e) => handleResume(c.id, e)}
                                                                >
                                                                    <Play className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}

                                                            {/* Duplicate */}
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                                title="Duplicate campaign"
                                                                onClick={(e) => handleDuplicate(c.id, e)}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>

                                                            {/* Delete (only for draft or confirm) */}
                                                            {confirmDelete === c.id ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-6 px-1.5 text-[10px]"
                                                                        onClick={() => setConfirmDelete(null)}
                                                                    >
                                                                        No
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-6 px-1.5 text-[10px] bg-red-600 text-white hover:bg-red-700"
                                                                        disabled={deleteCampaign.isPending}
                                                                        onClick={() => handleDelete(c.id)}
                                                                    >
                                                                        {deleteCampaign.isPending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : "Yes"}
                                                                    </Button>
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                                                    disabled={isRunning}
                                                                    title={isRunning ? "Cannot delete while running" : "Delete campaign"}
                                                                    onClick={() => setConfirmDelete(c.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UpgradeGuard>
    );
}
