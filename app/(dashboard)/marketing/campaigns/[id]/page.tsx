"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft, Loader2, Users, Send, CheckCheck, Eye,
    AlertCircle, MessageCircle, Download, Trash2, Megaphone,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
    useGetCampaign,
    useDeleteCampaign,
    useSendCampaign,
    CampaignRecipient,
    Campaign,
} from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// ─────────────────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────────────────

const CAMPAIGN_STATUS: Record<Campaign["status"], { label: string; classes: string; pulse?: boolean }> = {
    draft:   { label: "Draft",   classes: "border-zinc-300  bg-zinc-50   text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400" },
    sending: { label: "Sending", classes: "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-400", pulse: true },
    sent:    { label: "Sent",    classes: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    failed:  { label: "Failed",  classes: "border-red-300  bg-red-50   text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400" },
    paused:  { label: "Paused",  classes: "border-blue-300  bg-blue-50   text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400" },
};

const RECIPIENT_STATUS: Record<
    CampaignRecipient["status"],
    { label: string; classes: string }
> = {
    pending:   { label: "Pending",   classes: "border-zinc-300  bg-zinc-50   text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400" },
    sent:      { label: "Sent",      classes: "border-teal-300  bg-teal-50   text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-400" },
    delivered: { label: "Delivered", classes: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    read:      { label: "Read",      classes: "border-blue-300  bg-blue-50   text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400" },
    replied:   { label: "Replied",   classes: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
    failed:    { label: "Failed",    classes: "border-red-300  bg-red-50   text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400" },
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function StatCard({
    label, value, total, icon, color,
}: {
    label: string; value: number; total: number;
    icon: React.ReactNode; color: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>{icon}</div>
                <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
        </div>
    );
}

function FunnelChart({ steps }: { steps: { label: string; value: number; color: string }[] }) {
    const max = Math.max(...steps.map((s) => s.value), 1);
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">Engagement Funnel</h3>
            <div className="space-y-2">
                {steps.map((step) => {
                    const pctOfMax = Math.max(5, Math.round((step.value / max) * 100));
                    const pctOfFirst = steps[0].value > 0 ? Math.round((step.value / steps[0].value) * 100) : 0;
                    return (
                        <div key={step.label} className="flex items-center gap-3">
                            <span className="w-20 shrink-0 text-xs text-muted-foreground">{step.label}</span>
                            <div className="relative h-7 flex-1 rounded-full bg-muted">
                                <div
                                    className={`h-7 rounded-full ${step.color} transition-[width] duration-500`}
                                    style={{ width: `${pctOfMax}%` }}
                                />
                                <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                                    {step.value.toLocaleString()}
                                    <span className="ml-2 text-muted-foreground/80">({pctOfFirst}%)</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// CSV export
function toCsv(rows: string[][]): string {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return rows.map((r) => r.map(escape).join(",")).join("\n");
}
function downloadBlob(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

type RecipientFilter = CampaignRecipient["status"] | "all";

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useGetCampaign(id);
    const deleteMutation = useDeleteCampaign();
    const sendMutation = useSendCampaign();

    const [statusFilter, setStatusFilter] = useState<RecipientFilter>("all");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [sending, setSending] = useState(false);

    const campaign = data?.campaign;
    const recipients = data?.recipients ?? [];

    const filteredRecipients = useMemo(
        () => statusFilter === "all" ? recipients : recipients.filter((r) => r.status === statusFilter),
        [recipients, statusFilter],
    );

    async function handleSend() {
        if (!campaign) return;
        setSending(true);
        try {
            const result = await sendMutation.mutateAsync({ id: campaign.id });
            toast.success(`Campaign sent! ${result.sent_count} messages delivered.`);
            queryClient.invalidateQueries({ queryKey: ["getCampaign", id] });
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send campaign");
        } finally {
            setSending(false);
        }
    }

    async function handleDelete() {
        if (!campaign) return;
        try {
            await deleteMutation.mutateAsync({ id: campaign.id });
            toast.success("Campaign deleted");
            queryClient.invalidateQueries({ queryKey: ["listCampaigns"] });
            queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
            router.push("/marketing/campaigns");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete campaign");
            setConfirmDelete(false);
        }
    }

    function handleExport() {
        if (!campaign) return;
        const header = ["Contact", "Phone", "Status", "Sent At", "Delivered At", "Read At", "Error"];
        const rows = recipients.map((r) => [
            r.contact_name ?? r.name ?? "",
            r.contact_phone ?? r.phone,
            r.status,
            r.sent_at ?? "",
            r.delivered_at ?? "",
            r.read_at ?? "",
            r.error_message ?? "",
        ]);
        downloadBlob(
            `campaign-${campaign.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}-${String(campaign.id).slice(0, 8)}.csv`,
            toCsv([header, ...rows]),
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#35877D]" />
            </div>
        );
    }

    if (error || !campaign) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
                <p className="text-sm text-red-400">{error instanceof Error ? error.message : "Campaign not found"}</p>
                <Button variant="outline" onClick={() => router.push("/marketing/campaigns")}>Back to Campaigns</Button>
            </div>
        );
    }

    const statusInfo = CAMPAIGN_STATUS[campaign.status];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                icon={Megaphone}
                title={campaign.name}
                description={`Type: ${campaign.template_name === 'email' ? 'Email' : campaign.template_name === 'sms' ? 'SMS' : `WhatsApp (${campaign.template_name})`} · Created ${new Date(campaign.created_at).toLocaleDateString()}`}
                breadcrumbs={[
                    { label: "Engagement" },
                    { label: "Campaigns", href: "/marketing/campaigns" },
                    { label: campaign.name },
                ]}
                badge={statusInfo.label}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Send button — only for draft/failed */}
                        {(campaign.status === "draft" || campaign.status === "failed") && (
                            <Button
                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs cursor-pointer"
                                disabled={sending}
                                onClick={handleSend}
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
                                {sending ? "Sending…" : "Send Now"}
                            </Button>
                        )}
                        {/* Delete */}
                        {confirmDelete ? (
                            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-sm">
                                <span className="text-red-700 text-xs font-semibold">Delete campaign?</span>
                                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg"
                                    disabled={deleteMutation.isPending}
                                    onClick={handleDelete}
                                >
                                    {deleteMutation.isPending ? "Deleting…" : "Confirm"}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={campaign.status === "sending"}
                                onClick={() => setConfirmDelete(true)}
                                className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-9 cursor-pointer disabled:opacity-40"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Stats Cards */}
            <div className={`grid gap-3 ${
                campaign.template_name === 'email' 
                    ? 'grid-cols-1 sm:grid-cols-3' 
                    : campaign.template_name === 'sms' 
                    ? 'grid-cols-1 sm:grid-cols-2' 
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
            }`}>
                <StatCard label="Recipients" value={campaign.total_recipients} total={campaign.total_recipients}
                    icon={<Users className="h-4 w-4" />} color="bg-muted text-muted-foreground" />
                <StatCard label="Sent" value={campaign.sent_count} total={campaign.total_recipients}
                    icon={<Send className="h-4 w-4" />} color="bg-[#35877D]/10 text-[#35877D]" />
                
                {campaign.template_name !== 'email' && campaign.template_name !== 'sms' && (
                    <>
                        <StatCard label="Delivered" value={campaign.delivered_count} total={campaign.total_recipients}
                            icon={<CheckCheck className="h-4 w-4" />} color="bg-teal-500/10 text-teal-400" />
                        <StatCard label="Read" value={campaign.read_count} total={campaign.total_recipients}
                            icon={<Eye className="h-4 w-4" />} color="bg-blue-500/10 text-blue-400" />
                        <StatCard label="Replied" value={campaign.replied_count} total={campaign.total_recipients}
                            icon={<MessageCircle className="h-4 w-4" />} color="bg-indigo-500/10 text-indigo-400" />
                    </>
                )}

                {campaign.template_name !== 'sms' && (
                    <StatCard label="Failed" value={campaign.failed_count} total={campaign.total_recipients}
                        icon={<AlertCircle className="h-4 w-4" />} color="bg-red-500/10 text-red-400" />
                )}
            </div>

            {/* Funnel - Only for WhatsApp */}
            {campaign.template_name !== 'email' && campaign.template_name !== 'sms' && (
                <FunnelChart steps={[
                    { label: "Sent",      value: campaign.sent_count,      color: "bg-[#35877D]" },
                    { label: "Delivered", value: campaign.delivered_count, color: "bg-teal-500" },
                    { label: "Read",      value: campaign.read_count,      color: "bg-blue-500" },
                    { label: "Replied",   value: campaign.replied_count,   color: "bg-indigo-500" },
                ]} />
            )}

            {/* Recipients Table */}
            <div className="rounded-xl border border-border bg-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border px-4 py-4">
                    <h2 className="text-sm font-semibold text-foreground">
                        Recipients ({filteredRecipients.length}
                        {statusFilter !== "all" ? ` of ${recipients.length}` : ""})
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Status Filter */}
                        <div className="flex gap-1 flex-wrap">
                            {(["all", "sent", "delivered", "read", "replied", "failed", "pending"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                        statusFilter === s
                                            ? "border-[#35877D] bg-[#35877D]/10 text-[#35877D]"
                                            : "border-border text-muted-foreground hover:border-[#35877D]/50"
                                    }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="outline" size="sm"
                            onClick={handleExport}
                            disabled={recipients.length === 0}
                            className="border-border text-muted-foreground hover:bg-muted"
                        >
                            <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                        </Button>
                    </div>
                </div>

                {filteredRecipients.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                            {recipients.length === 0 ? "No recipients recorded yet." : "No recipients match this filter."}
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
                                    <TableHead>Sent</TableHead>
                                    <TableHead>Delivered</TableHead>
                                    <TableHead>Read</TableHead>
                                    <TableHead>Error</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecipients.map((r) => {
                                    const rs = RECIPIENT_STATUS[r.status];
                                    return (
                                        <TableRow key={r.id} className="border-border">
                                            <TableCell className="font-medium">{r.contact_name ?? r.name ?? "Unknown"}</TableCell>
                                            <TableCell className="text-muted-foreground">{r.contact_phone ?? r.phone}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${rs.classes}`}>
                                                    {rs.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {r.delivered_at ? new Date(r.delivered_at).toLocaleString() : "—"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {r.read_at ? new Date(r.read_at).toLocaleString() : "—"}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-xs text-red-400">
                                                {r.error_message ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
