"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Activity,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RotateCw,
    MessageCircle,
    Zap,
    CreditCard,
    Webhook,
    ShieldCheck,
    Key,
    Clock,
    ArrowUpRight,
    Play,
    Loader2,
    Server,
    Wifi,
    Radio,
    FileText,
    ArrowLeft,
    Layers,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    useGetIntegrationHealth,
    useTestIntegrationHealth,
    useTestAllIntegrations,
    IntegrationHealthItem,
} from "@/lib/api-client-react";

export default function IntegrationHealthPage() {
    const { data, isLoading, refetch, isFetching } = useGetIntegrationHealth();
    const testMutation = useTestIntegrationHealth();
    const testAllMutation = useTestAllIntegrations();

    const [activeTestingChannel, setActiveTestingChannel] = useState<string | null>(null);
    const [recentTestResults, setRecentTestResults] = useState<Record<string, { success: boolean; duration_ms: number; message: string; at: string }>>({});

    const overview = data?.data;
    const integrations = overview?.integrations;

    async function handleTestSingle(channel: string) {
        setActiveTestingChannel(channel);
        try {
            const res = await testMutation.mutateAsync({ channel });
            const testData = res.data;
            setRecentTestResults((prev) => ({
                ...prev,
                [channel]: {
                    success: testData.success,
                    duration_ms: testData.duration_ms,
                    message: testData.message,
                    at: new Date().toLocaleTimeString(),
                },
            }));

            if (testData.success) {
                toast.success(`${testData.channel.toUpperCase()} connection healthy (${testData.duration_ms}ms)`);
            } else {
                toast.error(`${testData.channel.toUpperCase()} test failed: ${testData.message}`);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Failed to test ${channel}`);
        } finally {
            setActiveTestingChannel(null);
        }
    }

    async function handleTestAll() {
        try {
            const res = await testAllMutation.mutateAsync();
            const results = res.data?.results ?? {};

            const formatted: Record<string, any> = {};
            for (const [ch, info] of Object.entries(results)) {
                formatted[ch] = {
                    success: (info as any).success,
                    duration_ms: (info as any).duration_ms ?? 0,
                    message: (info as any).message ?? "",
                    at: new Date().toLocaleTimeString(),
                };
            }
            setRecentTestResults(formatted);
            toast.success("All integration health checks completed.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to run health tests");
        }
    }

    // Helper for Channel Icons
    function getChannelIcon(key: string) {
        switch (key) {
            case "whatsapp":
                return <MessageCircle className="h-5 w-5 text-emerald-600" />;
            case "pusher":
                return <Radio className="h-5 w-5 text-indigo-600" />;
            case "razorpay":
                return <CreditCard className="h-5 w-5 text-blue-600" />;
            case "webhook":
                return <Webhook className="h-5 w-5 text-cyan-600" />;
            default:
                return <Server className="h-5 w-5 text-slate-600" />;
        }
    }

    // Status Badge Component
    function StatusPill({ status, connected }: { status: string; connected: boolean }) {
        if (status === "connected") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Connected
                </span>
            );
        }
        if (status === "degraded") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 text-amber-600" />
                    Degraded
                </span>
            );
        }
        if (status === "unconfigured") {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    <XCircle className="h-3 w-3 text-slate-400" />
                    Unconfigured
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                <XCircle className="h-3 w-3 text-red-600" />
                Disconnected
            </span>
        );
    }

    function formatDate(dateStr: string | null | undefined) {
        if (!dateStr) return "None recorded";
        try {
            const d = new Date(dateStr);
            return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        } catch {
            return dateStr;
        }
    }

    return (
        <div className="space-y-6 w-full pb-16">
            {/* Page Header */}
            <PageHeader
                icon={Activity}
                title="Integration & Webhook Health"
                description="Real-time health telemetry, connection heartbeat, webhook latency, and token credentials across WhatsApp, Pusher, Razorpay, and Webhook engines."
                breadcrumbs={[
                    { label: "Channels & Integrations", href: "/integrations" },
                    { label: "Health Dashboard" },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="h-9 text-xs px-3 gap-1.5"
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleTestAll}
                            disabled={testAllMutation.isPending}
                            className="bg-[#2F8F83] hover:bg-[#267A70] text-white h-9 text-xs px-3.5 font-semibold shadow-xs gap-1.5"
                        >
                            {testAllMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Play className="h-3.5 w-3.5" />
                            )}
                            Test All Connections
                        </Button>
                    </div>
                }
            />

            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* System Status */}
                <Card className="border border-border/80 shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                System Status
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold capitalize text-foreground">
                                    {overview?.overall_status ?? "Checking..."}
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground block">
                                {overview?.healthy_count ?? 0} of {overview?.total_integrations ?? 4} operational
                            </span>
                        </div>
                        <div className={`p-3 rounded-xl ${
                            overview?.overall_status === "healthy"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                                : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                        }`}>
                            <Activity className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Healthy Services */}
                <Card className="border border-border/80 shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                Operational Channels
                            </span>
                            <span className="text-xl font-bold text-emerald-600 block">
                                {overview?.healthy_count ?? 0} / {overview?.total_integrations ?? 4}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                                Active message pipelines
                            </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* 24h Errors */}
                <Card className="border border-border/80 shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                Errors (Past 24h)
                            </span>
                            <span className={`text-xl font-bold block ${
                                (overview?.total_errors_24h ?? 0) > 0 ? "text-amber-600" : "text-foreground"
                            }`}>
                                {overview?.total_errors_24h ?? 0}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                                API & webhook failures
                            </span>
                        </div>
                        <div className={`p-3 rounded-xl ${
                            (overview?.total_errors_24h ?? 0) > 0
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-900"
                        }`}>
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>

                {/* Last Audit */}
                <Card className="border border-border/80 shadow-2xs">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                                Last Telemetry Poll
                            </span>
                            <span className="text-sm font-semibold text-foreground block truncate max-w-[140px]">
                                {overview?.checked_at ? new Date(overview.checked_at).toLocaleTimeString() : "Pending"}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                                Auto-polls every 15s
                            </span>
                        </div>
                        <div className="p-3 rounded-xl bg-teal-50 text-[#2F8F83] dark:bg-teal-950/40">
                            <Clock className="h-6 w-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Loading Indicator */}
            {isLoading && !overview && (
                <div className="flex h-48 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-[#2F8F83]" />
                </div>
            )}

            {/* 4 Integration Health Cards Grid */}
            {integrations && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {(Object.keys(integrations) as Array<keyof typeof integrations>).map((key) => {
                        const item: IntegrationHealthItem = integrations[key];
                        const testInfo = recentTestResults[key];
                        const isTesting = activeTestingChannel === key || testAllMutation.isPending;

                        return (
                            <Card key={key} className="border border-border/80 shadow-2xs flex flex-col justify-between overflow-hidden">
                                {/* Card Header */}
                                <CardHeader className="bg-slate-50/60 dark:bg-slate-900/30 border-b border-border/60 p-4 sm:p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-xl border border-border bg-white dark:bg-slate-950 p-2.5 shadow-2xs mt-0.5">
                                                {getChannelIcon(item.key)}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-sm font-semibold text-foreground">
                                                        {item.name}
                                                    </CardTitle>
                                                    <StatusPill status={item.status} connected={item.connected} />
                                                </div>
                                                <CardDescription className="text-xs text-muted-foreground line-clamp-1">
                                                    {item.description}
                                                </CardDescription>
                                            </div>
                                        </div>

                                        {/* Test Ping Button */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleTestSingle(item.key)}
                                            disabled={isTesting}
                                            className="h-8 text-xs px-2.5 shrink-0 gap-1.5"
                                        >
                                            {isTesting ? (
                                                <Loader2 className="h-3 w-3 animate-spin text-[#2F8F83]" />
                                            ) : (
                                                <Wifi className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            <span>Test Ping</span>
                                        </Button>
                                    </div>

                                    {/* Test Result Toast Bar */}
                                    {testInfo && (
                                        <div className={`mt-3 rounded-lg border p-2 text-xs flex items-center justify-between ${
                                            testInfo.success
                                                ? "border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900"
                                                : "border-red-200 bg-red-50/90 text-red-800 dark:bg-red-950/30 dark:border-red-900"
                                        }`}>
                                            <span className="truncate mr-2 font-medium">
                                                {testInfo.message}
                                            </span>
                                            <span className="text-[10px] font-mono shrink-0 opacity-80">
                                                {testInfo.duration_ms}ms · {testInfo.at}
                                            </span>
                                        </div>
                                    )}
                                </CardHeader>

                                {/* Card Body: 6 Required Health Fields */}
                                <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {/* 1. Connected / Disconnected State */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Connection State
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {item.connected ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Active & Operational
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-xs">
                                                        <XCircle className="h-3.5 w-3.5 text-slate-400" /> Offline / Disconnected
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Token Status & Preview */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Credentials & Token
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <Key className="h-3.5 w-3.5 text-[#2F8F83] shrink-0" />
                                                <span className="font-semibold text-foreground">
                                                    {item.token_status.status === "valid" ? "Valid Token" : item.token_status.status === "missing" ? "Missing Credentials" : item.token_status.status}
                                                </span>
                                            </div>
                                            {item.token_status.masked && (
                                                <span className="font-mono text-[11px] text-muted-foreground block truncate">
                                                    {item.token_status.masked}
                                                </span>
                                            )}
                                        </div>

                                        {/* 3. Last Successful Request */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Last Successful Request
                                            </span>
                                            <span className="text-foreground font-medium block">
                                                {formatDate(item.last_successful_request)}
                                            </span>
                                        </div>

                                        {/* 4. Last Webhook */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Last Webhook Event
                                            </span>
                                            <span className="text-foreground font-medium block truncate">
                                                {formatDate(item.last_webhook.timestamp)}
                                            </span>
                                            {item.last_webhook.event_type && (
                                                <span className="text-[10px] text-muted-foreground block truncate font-mono">
                                                    Event: {item.last_webhook.event_type}
                                                </span>
                                            )}
                                        </div>

                                        {/* 5. Last Failure */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Last Failure
                                            </span>
                                            {item.last_failure.timestamp ? (
                                                <div className="space-y-0.5">
                                                    <span className="text-red-600 font-semibold block text-[11px]">
                                                        {formatDate(item.last_failure.timestamp)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground block truncate" title={item.last_failure.message ?? ""}>
                                                        {item.last_failure.message}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-emerald-600 font-medium block">
                                                    No recorded failures
                                                </span>
                                            )}
                                        </div>

                                        {/* 6. Error Count (24h) */}
                                        <div className="p-2.5 rounded-lg border border-border/70 bg-muted/20 space-y-1">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                                                Error Count (24h)
                                            </span>
                                            <span className={`text-base font-bold block ${
                                                item.error_count_24h > 0 ? "text-amber-600" : "text-emerald-600"
                                            }`}>
                                                {item.error_count_24h} {item.error_count_24h === 1 ? "error" : "errors"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Channel Specific Metadata Badges */}
                                    {item.metadata && (
                                        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2">
                                            {Object.entries(item.metadata).map(([k, v]) => {
                                                if (v === null || v === undefined) return null;
                                                return (
                                                    <span
                                                        key={k}
                                                        className="inline-flex items-center gap-1 rounded bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                                    >
                                                        <strong className="text-foreground">{k.replace(/_/g, " ")}:</strong>{" "}
                                                        {typeof v === "boolean" ? (v ? "Yes" : "No") : Array.isArray(v) ? v.join(", ") : String(v)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Inbound & Outbound Architecture Reference */}
            <Card className="border border-border/80 shadow-2xs">
                <CardHeader className="p-5 border-b border-border/60">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-[#2F8F83]" />
                        <CardTitle className="text-sm font-semibold">
                            Integration Architecture & Inbound Webhook Listener Routes
                        </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                        All incoming events and outbound broadcasts use resilient multi-tenant isolation with HMAC-SHA256 signature verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1.5">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <MessageCircle className="h-4 w-4 text-emerald-600" />
                            Meta WhatsApp Webhook
                        </span>
                        <code className="text-[11px] bg-background border px-1.5 py-0.5 rounded block text-muted-foreground truncate">
                            POST /api/webhooks/whatsapp
                        </code>
                        <p className="text-[11px] text-muted-foreground">
                            Verified with <code>X-Hub-Signature-256</code> against tenant App Secret. Ingests inbound messages & message status updates.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1.5">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Razorpay Payment Webhook
                        </span>
                        <code className="text-[11px] bg-background border px-1.5 py-0.5 rounded block text-muted-foreground truncate">
                            POST /api/webhooks/razorpay
                        </code>
                        <p className="text-[11px] text-muted-foreground">
                            Verified with <code>X-Razorpay-Signature</code> against tenant Webhook Secret. Confirms credit recharges and invoice settlements.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border/70 bg-muted/20 space-y-1.5">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <Radio className="h-4 w-4 text-indigo-600" />
                            Pusher WebSocket Engine
                        </span>
                        <code className="text-[11px] bg-background border px-1.5 py-0.5 rounded block text-muted-foreground truncate">
                            Channel: workspace.&#123;id&#125;
                        </code>
                        <p className="text-[11px] text-muted-foreground">
                            Encrypted WebSocket subscriptions with private channel authorization for realtime inbox messages and delivery progress.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
