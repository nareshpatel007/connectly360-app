"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Megaphone, Send, Percent, Plus, Loader2, Radio,
    Calendar, Users, CheckCheck, AlertCircle, Trash2,
    Mail, MessageSquare, MessageCircle,
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
    Campaign,
} from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<
    Campaign["status"],
    { label: string; classes: string; pulse?: boolean }
> = {
    draft: { label: "Draft", classes: "border-zinc-300  bg-zinc-50   text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400" },
    sending: { label: "Sending", classes: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-400", pulse: true },
    sent: { label: "Sent", classes: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    failed: { label: "Failed", classes: "border-red-300  bg-red-50   text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400" },
    paused: { label: "Paused", classes: "border-blue-300  bg-blue-50   text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400" },
};

function StatusBadge({ status }: { status: Campaign["status"] }) {
    const s = STATUS_MAP[status] ?? STATUS_MAP.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.classes}`}>
            {s.pulse && (
                <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-400" />
                </span>
            )}
            {s.label}
        </span>
    );
}

function percent(n: number, d: number) {
    if (!d) return 0;
    return Math.round((n / d) * 100);
}

function RateBar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = percent(value, total);
    return (
        <div className="flex items-center gap-2">
            <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function CampaignsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: campaigns = [], isLoading, error } = useListCampaigns({
        refetchInterval: (query: any) => {
            const list = query?.state?.data as Campaign[] | undefined;
            return list?.some((c) => c.status === "sending") ? 3000 : false;
        }
    });
    const { data: stats } = useGetCampaignStats({
        refetchInterval: campaigns.some((c) => c.status === "sending") ? 3000 : false,
    });
    const deleteCampaign = useDeleteCampaign();

    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

    async function handleDelete(id: number) {
        try {
            await deleteCampaign.mutateAsync({ id });
            toast.success("Campaign deleted");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
        } finally {
            setConfirmDelete(null);
        }
    }

    return (
        <UpgradeGuard
            allowedPlans={["business", "enterprise"]}
            featureName="Bulk Campaigns"
            description="Send broadcast campaigns, target user segments, and schedule bulk notifications to your lists."
        >
            <div className="space-y-6 w-full">
                {/* Page Header */}
                <PageHeader
                    icon={Megaphone}
                    title="Campaigns"
                    description="Design, target, and launch WhatsApp bulk broadcast campaigns."
                    breadcrumbs={[{ label: "Engagement" }, { label: "Campaigns" }]}
                    actions={
                        <Button
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer font-semibold text-xs h-9 px-4"
                            onClick={() => router.push("/marketing/campaigns/new")}
                        >
                            <Plus className="h-4 w-4" />
                            New Campaign
                        </Button>
                    }
                />

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_campaigns ?? "—"}</div>
                            <p className="text-xs text-muted-foreground">Outbound broadcast operations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_sent?.toLocaleString() ?? "—"}</div>
                            <p className="text-xs text-muted-foreground">Across all campaigns</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats ? `${stats.delivery_rate}%` : "—"}
                            </div>
                            <p className="text-xs text-muted-foreground">High deliverability</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Broadcast History</CardTitle>
                        <CardDescription>View status and analytics for previous broadcast campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-[#2F8F83]" />
                            </div>
                        ) : error ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-2 px-4">
                                <AlertCircle className="h-8 w-8 text-red-400" />
                                <p className="text-sm text-red-400">Failed to load campaigns</p>
                                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["listCampaigns"] })}>
                                    Retry
                                </Button>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-b-xl">
                                <Radio className="h-10 w-10 text-muted-foreground" />
                                <p className="text-sm font-medium">No campaigns yet</p>
                                <p className="text-xs text-muted-foreground">Create your first campaign to reach your contacts at scale.</p>
                                <Button
                                    className="mt-1 bg-[#2F8F83] hover:bg-[#267A70] text-white"
                                    onClick={() => router.push("/marketing/campaigns/new")}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> New Campaign
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead>Name</TableHead>
                                            <TableHead className="hidden md:table-cell">Template</TableHead>
                                            <TableHead className="hidden sm:table-cell text-right">Recipients</TableHead>
                                            <TableHead className="hidden lg:table-cell">Delivery</TableHead>
                                            <TableHead className="hidden lg:table-cell">Read</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden sm:table-cell">Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaigns.map((c) => (
                                            <TableRow
                                                key={c.id}
                                                className="cursor-pointer border-border hover:bg-muted/50"
                                                onClick={() => router.push(`/marketing/campaigns/${c.id}`)}
                                            >
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {c.template_name === 'email' ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                                                            <Mail className="h-3 w-3" /> Email
                                                        </span>
                                                    ) : c.template_name === 'sms' ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                                                            <MessageSquare className="h-3 w-3" /> SMS
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                                            <MessageCircle className="h-3 w-3" /> WhatsApp ({c.template_name})
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-right text-muted-foreground tabular-nums">
                                                    {c.total_recipients}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex flex-col gap-0.5">
                                                        <RateBar value={c.delivered_count} total={c.total_recipients} color="bg-[#2F8F83]" />
                                                        <span className="text-[10px] text-muted-foreground ml-11">
                                                            {c.delivered_count} / {c.total_recipients}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <div className="flex flex-col gap-0.5">
                                                        <RateBar value={c.read_count} total={c.total_recipients} color="bg-blue-500" />
                                                        <span className="text-[10px] text-muted-foreground ml-11">
                                                            {c.read_count} / {c.total_recipients}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={c.status} />
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(c.created_at).toLocaleDateString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    {confirmDelete === c.id ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 px-2 text-xs"
                                                                onClick={() => setConfirmDelete(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="h-7 px-2 text-xs bg-red-600 text-white hover:bg-red-700"
                                                                disabled={deleteCampaign.isPending}
                                                                onClick={() => handleDelete(c.id)}
                                                            >
                                                                {deleteCampaign.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                                                            </Button>
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                                            disabled={c.status === "sending"}
                                                            title={c.status === "sending" ? "Cannot delete while sending" : "Delete campaign"}
                                                            onClick={() => setConfirmDelete(c.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
