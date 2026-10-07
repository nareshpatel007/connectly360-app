"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
    Webhook,
    Plus,
    Globe,
    CheckCircle2,
    Trash2,
    Send,
    Activity,
    ExternalLink,
    RefreshCw,
    Shield,
    Key,
    Copy,
    Check,
    AlertCircle,
    Info,
    Edit3,
    PauseCircle,
    PlayCircle,
    MoreVertical,
    FileText,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Code2,
    Lock,
    Clock,
    AlertTriangle
} from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
    useWebhookEndpoints,
    useWebhookEvents,
    useCreateWebhookEndpoint,
    useUpdateWebhookEndpoint,
    useDeleteWebhookEndpoint,
    useRotateWebhookSecret,
    useToggleWebhookStatus,
    useTestWebhookPing,
    WebhookEndpointItem,
    WebhookEventDefinition
} from "@/lib/api-client-react";

export default function WebhooksPage() {
    const { user } = useAuth();
    const { can, isOwner } = usePermissions();
    const workspaceId = user?.tenant_id;

    // RBAC check: allow owners, admins, or users with developer/webhook permissions
    const canManage = isOwner || can("developer.webhooks.manage") || can("developer.manage") || can("developer.view");

    // Queries
    const {
        data: endpoints = [],
        isLoading: isEndpointsLoading,
        isError: isEndpointsError,
        refetch: refetchEndpoints
    } = useWebhookEndpoints(workspaceId);

    const {
        data: categoriesData = {},
        isLoading: isEventsLoading
    } = useWebhookEvents(workspaceId);

    // Mutations
    const createMutation = useCreateWebhookEndpoint(workspaceId);
    const updateMutation = useUpdateWebhookEndpoint(workspaceId);
    const deleteMutation = useDeleteWebhookEndpoint(workspaceId);
    const rotateSecretMutation = useRotateWebhookSecret(workspaceId);
    const toggleStatusMutation = useToggleWebhookStatus(workspaceId);
    const testPingMutation = useTestWebhookPing(workspaceId);

    // Modals state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpointItem | null>(null);
    const [deletingEndpoint, setDeletingEndpoint] = useState<WebhookEndpointItem | null>(null);
    const [rotatingEndpoint, setRotatingEndpoint] = useState<WebhookEndpointItem | null>(null);
    
    // One-time secret display modal
    const [revealedSecret, setRevealedSecret] = useState<{
        name: string;
        secret: string;
    } | null>(null);
    const [hasCopiedSecret, setHasCopiedSecret] = useState(false);

    // Test ping result state
    const [testPingResult, setTestPingResult] = useState<{
        endpointId: number;
        success: boolean;
        httpStatus?: number | null;
        durationMs?: number | null;
        message: string;
        eventId?: string;
    } | null>(null);

    // Event categories normalization (resilient to array or object payload)
    const groupedCategoriesList = useMemo(() => {
        if (!categoriesData) return [];

        if (Array.isArray(categoriesData)) {
            return categoriesData.map((cat: any) => ({
                name: cat.name || cat.id || "General",
                events: Array.isArray(cat.events) ? (cat.events as WebhookEventDefinition[]) : []
            }));
        }

        if (typeof categoriesData === "object") {
            return Object.entries(categoriesData).map(([catName, val]: [string, any]) => {
                if (Array.isArray(val)) {
                    return { name: catName, events: val as WebhookEventDefinition[] };
                }
                if (val && Array.isArray(val.events)) {
                    return { name: val.name || catName, events: val.events as WebhookEventDefinition[] };
                }
                return { name: catName, events: [] as WebhookEventDefinition[] };
            });
        }

        return [];
    }, [categoriesData]);

    // Add / Edit form fields
    const [formName, setFormName] = useState("");
    const [formUrl, setFormUrl] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [customHeadersList, setCustomHeadersList] = useState<{ key: string; value: string }[]>([]);
    const [showDocs, setShowDocs] = useState(false);

    // Open add modal
    const handleOpenAdd = () => {
        setEditingEndpoint(null);
        setFormName("");
        setFormUrl("");
        setFormDescription("");
        setSelectedEvents(["message.received", "message.failed", "campaign.completed", "campaign.failed"]);
        setCustomHeadersList([]);
        setIsAddOpen(true);
    };

    // Open edit modal
    const handleOpenEdit = (ep: WebhookEndpointItem) => {
        setEditingEndpoint(ep);
        setFormName(ep.name);
        setFormUrl(ep.url);
        setFormDescription(ep.description || "");
        setSelectedEvents(ep.events || []);
        
        const headersArr: { key: string; value: string }[] = [];
        if (ep.custom_headers && typeof ep.custom_headers === "object") {
            Object.entries(ep.custom_headers).forEach(([k, v]) => {
                headersArr.push({ key: k, value: String(v) });
            });
        }
        setCustomHeadersList(headersArr);
        setIsAddOpen(true);
    };

    // Event toggling
    const handleToggleEvent = (key: string) => {
        setSelectedEvents(prev =>
            prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]
        );
    };

    const handleToggleCategory = (events: WebhookEventDefinition[]) => {
        if (!Array.isArray(events)) return;
        const eventKeys = events.map(e => e.key);
        const allSelected = eventKeys.length > 0 && eventKeys.every(k => selectedEvents.includes(k));
        if (allSelected) {
            setSelectedEvents(prev => prev.filter(k => !eventKeys.includes(k)));
        } else {
            setSelectedEvents(prev => Array.from(new Set([...prev, ...eventKeys])));
        }
    };

    // Custom header management
    const handleAddHeaderRow = () => {
        if (customHeadersList.length >= 10) {
            toast.error("Maximum of 10 custom headers allowed");
            return;
        }
        setCustomHeadersList(prev => [...prev, { key: "", value: "" }]);
    };

    const handleRemoveHeaderRow = (index: number) => {
        setCustomHeadersList(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateHeaderRow = (index: number, field: "key" | "value", val: string) => {
        setCustomHeadersList(prev => {
            const next = [...prev];
            next[index][field] = val;
            return next;
        });
    };

    // Save endpoint
    const handleSaveEndpoint = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formName.trim()) {
            toast.error("Endpoint name is required");
            return;
        }

        const urlTrimmed = formUrl.trim();
        if (!urlTrimmed) {
            toast.error("Endpoint URL is required");
            return;
        }

        if (!urlTrimmed.startsWith("https://") && !urlTrimmed.startsWith("http://localhost")) {
            toast.error("Endpoint URL must use secure HTTPS (http://localhost permitted only for local dev)");
            return;
        }

        if (selectedEvents.length === 0) {
            toast.error("Please select at least one event to subscribe to");
            return;
        }

        // Format custom headers
        const custom_headers: Record<string, string> = {};
        for (const row of customHeadersList) {
            if (row.key.trim()) {
                custom_headers[row.key.trim()] = row.value;
            }
        }

        try {
            if (editingEndpoint) {
                await updateMutation.mutateAsync({
                    id: editingEndpoint.id,
                    name: formName.trim(),
                    url: urlTrimmed,
                    events: selectedEvents,
                    description: formDescription.trim() || undefined,
                    custom_headers: Object.keys(custom_headers).length > 0 ? custom_headers : undefined,
                });
                toast.success("Webhook endpoint updated successfully");
                setIsAddOpen(false);
            } else {
                const created = await createMutation.mutateAsync({
                    name: formName.trim(),
                    url: urlTrimmed,
                    events: selectedEvents,
                    description: formDescription.trim() || undefined,
                    custom_headers: Object.keys(custom_headers).length > 0 ? custom_headers : undefined,
                });
                setIsAddOpen(false);
                toast.success("Webhook endpoint registered successfully");

                // Show one-time secret modal if returned
                if (created.secret) {
                    setRevealedSecret({
                        name: created.name,
                        secret: created.secret,
                    });
                    setHasCopiedSecret(false);
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save webhook endpoint");
        }
    };

    // Delete endpoint
    const handleConfirmDelete = async () => {
        if (!deletingEndpoint) return;
        try {
            await deleteMutation.mutateAsync(deletingEndpoint.id);
            toast.success("Webhook endpoint deleted");
            setDeletingEndpoint(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete endpoint");
        }
    };

    // Rotate secret
    const handleConfirmRotateSecret = async () => {
        if (!rotatingEndpoint) return;
        try {
            const updated = await rotateSecretMutation.mutateAsync(rotatingEndpoint.id);
            setRotatingEndpoint(null);
            toast.success("Webhook secret regenerated");

            if (updated.secret) {
                setRevealedSecret({
                    name: updated.name,
                    secret: updated.secret,
                });
                setHasCopiedSecret(false);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to regenerate secret");
        }
    };

    // Toggle active / paused
    const handleToggleStatus = async (ep: WebhookEndpointItem) => {
        const nextAction = ep.status === "active" ? "disable" : "enable";
        try {
            await toggleStatusMutation.mutateAsync({ id: ep.id, action: nextAction });
            toast.success(nextAction === "enable" ? "Webhook endpoint resumed" : "Webhook endpoint paused");
        } catch (err: any) {
            toast.error(err.message || `Failed to ${nextAction} endpoint`);
        }
    };

    // Test ping
    const handleTestPing = async (ep: WebhookEndpointItem) => {
        try {
            toast.loading(`Sending test ping to ${ep.name}...`, { id: `ping-${ep.id}` });
            const result = await testPingMutation.mutateAsync(ep.id);
            toast.dismiss(`ping-${ep.id}`);

            if (result.success) {
                toast.success(`Test ping succeeded: HTTP ${result.delivery.http_status} (${result.delivery.duration_ms}ms)`);
            } else {
                toast.error(`Test ping failed: ${result.message || "HTTP failure"}`);
            }

            setTestPingResult({
                endpointId: ep.id,
                success: result.success,
                httpStatus: result.delivery?.http_status,
                durationMs: result.delivery?.duration_ms,
                message: result.message || (result.success ? "HTTP 200 OK" : "Failed"),
                eventId: result.delivery?.event_id,
            });
        } catch (err: any) {
            toast.dismiss(`ping-${ep.id}`);
            toast.error(err.message || "Test ping execution failed");
        }
    };

    // Copy helper
    const copyToClipboard = (text: string, label = "Copied to clipboard") => {
        navigator.clipboard.writeText(text);
        toast.success(label);
    };

    return (
        <UpgradeGuard
            allowedPlans={["growth", "business", "enterprise"]}
            featureName="Webhooks"
            description="Configure real-time webhooks to automatically forward WhatsApp events, campaigns, and workspace alerts to your server."
        >
            <div className="space-y-6 w-full">
                <PageHeader
                    icon={Webhook}
                    title="Realtime Webhooks"
                    description="Configure HTTPS endpoints to receive immediate delivery status, incoming messages, and campaign events."
                    breadcrumbs={[
                        { label: "Developer", href: "/developer" },
                        { label: "Webhooks" }
                    ]}
                    actions={
                        <div className="flex items-center gap-2.5">
                            <Link href="/developer/webhook-logs">
                                <Button
                                    variant="outline"
                                    className="border-[#E5E9EE] text-[#172033] hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer h-9 px-4 hover:border-[#2F8F83] hover:text-[#2F8F83]"
                                >
                                    <Activity size={14} className="text-[#2F8F83]" />
                                    Delivery Logs
                                </Button>
                            </Link>

                            <Button
                                onClick={handleOpenAdd}
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg shadow-2xs flex items-center gap-2 cursor-pointer text-xs font-semibold h-9 px-4"
                            >
                                <Plus size={16} />
                                Add Webhook Endpoint
                            </Button>
                        </div>
                    }
                />

                {/* Main Endpoints Card */}
                <Card className="border border-[#E5E9EE] bg-white rounded-xl shadow-2xs overflow-hidden">
                    <CardHeader className="border-b border-[#E5E9EE] pb-4 flex flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-base font-bold text-[#172033]">Configured Endpoints</CardTitle>
                            <CardDescription className="text-xs text-[#5F6B7A] mt-0.5">
                                Connectly360 sends POST requests signed with your workspace HMAC secret.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8A95A3] font-medium">
                                {endpoints.length} {endpoints.length === 1 ? "endpoint" : "endpoints"}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => refetchEndpoints()}
                                className="h-8 w-8 p-0 text-[#8A95A3] hover:text-[#172033] rounded-lg cursor-pointer"
                                title="Refresh"
                            >
                                <RefreshCw size={13} className={isEndpointsLoading ? "animate-spin text-[#2F8F83]" : ""} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isEndpointsLoading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="p-5 border border-[#E5E9EE] rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="h-5 w-48 rounded" />
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-96 rounded" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-5 w-24 rounded-md" />
                                            <Skeleton className="h-5 w-24 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : isEndpointsError ? (
                            <div className="p-8">
                                <ErrorState
                                    title="Unable to load webhook endpoints"
                                    description="Failed to retrieve configured webhook destinations from the server."
                                    onRetry={() => refetchEndpoints()}
                                />
                            </div>
                        ) : endpoints.length === 0 ? (
                            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-[#E8F6F3] flex items-center justify-center text-[#2F8F83] mb-3 border border-[#BFE4DD]">
                                    <Webhook size={28} />
                                </div>
                                <h3 className="text-base font-bold text-[#172033]">No webhook endpoints configured</h3>
                                <p className="text-xs text-[#5F6B7A] max-w-md mt-1 mb-6 leading-relaxed">
                                    Connectly360 can send real-time events to your systems when messages, campaigns, payments, and other workspace events occur.
                                </p>
                                <Button
                                    onClick={handleOpenAdd}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer h-9 px-4"
                                >
                                    <Plus size={15} />
                                    Add Webhook Endpoint
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#E5E9EE]">
                                {endpoints.map((ep) => {
                                    const totalDeliveries = ep.success_count + ep.failure_count;
                                    const successRate = totalDeliveries > 0
                                        ? Math.round((ep.success_count / totalDeliveries) * 100)
                                        : 100;

                                    const isTesting = testPingMutation.isPending && testPingResult?.endpointId === ep.id;

                                    return (
                                        <div
                                            key={ep.id}
                                            className="p-5 sm:p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                                        >
                                            <div className="space-y-3 flex-1 min-w-0">
                                                {/* Header row: Name, Status badge, Health */}
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <h3 className="text-sm font-bold text-[#172033] truncate">
                                                        {ep.name}
                                                    </h3>

                                                    {/* Status Badge */}
                                                    {ep.status === "active" ? (
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2 py-0.5">
                                                            Active
                                                        </Badge>
                                                    ) : ep.status === "failing" ? (
                                                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2 py-0.5">
                                                            Failing ({ep.consecutive_failures} failures)
                                                        </Badge>
                                                    ) : ep.status === "disabled" ? (
                                                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-semibold px-2 py-0.5">
                                                            Disabled
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] bg-[#F1F3F5] text-[#5F6B7A] border-[#E5E9EE] font-semibold px-2 py-0.5">
                                                            Paused
                                                        </Badge>
                                                    )}

                                                    {/* Health / Success Rate */}
                                                    {totalDeliveries > 0 && (
                                                        <span className="text-[11px] text-[#5F6B7A] flex items-center gap-1">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${successRate >= 95 ? "bg-emerald-500" : successRate >= 80 ? "bg-amber-500" : "bg-rose-500"}`} />
                                                            {successRate}% success ({totalDeliveries} calls)
                                                        </span>
                                                    )}
                                                </div>

                                                {/* URL and copy */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 bg-[#F1F3F5] px-2.5 py-1 rounded-lg border border-[#E5E9EE] font-mono text-xs text-[#172033] max-w-full overflow-hidden text-ellipsis">
                                                        <Globe size={13} className="text-[#8A95A3] shrink-0" />
                                                        <span className="truncate">{ep.url}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(ep.url, "Endpoint URL copied")}
                                                        className="text-[#8A95A3] hover:text-[#172033] p-1 rounded transition-colors cursor-pointer"
                                                        title="Copy URL"
                                                    >
                                                        <Copy size={13} />
                                                    </button>
                                                </div>

                                                {/* Subscribed events */}
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {(ep.events || []).map((ev) => (
                                                        <span
                                                             key={ev}
                                                             className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8F6F3] text-[#2F8F83] border border-[#BFE4DD] font-mono font-medium"
                                                        >
                                                            {ev}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Meta row: Masked secret and Last Delivery */}
                                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-[#8A95A3] pt-0.5">
                                                    <span className="flex items-center gap-1 font-mono">
                                                        <Key size={11} className="text-[#8A95A3]" />
                                                        Signing Secret: {ep.masked_secret || "whsec_••••••••••••••••"}
                                                    </span>

                                                    <span>•</span>

                                                    <span>
                                                        {ep.last_delivery_at ? (
                                                            <>
                                                                Latest Ping: {new Date(ep.last_delivery_at).toLocaleString([], {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit"
                                                                })}
                                                                {ep.last_failure_at && ep.last_failure_at > (ep.last_success_at || "") ? (
                                                                    <span className="text-rose-500 font-semibold ml-1">(Last call failed)</span>
                                                                ) : ep.last_success_at ? (
                                                                    <span className="text-emerald-600 font-semibold ml-1">(200 OK)</span>
                                                                ) : null}
                                                            </>
                                                        ) : (
                                                            "Never tested"
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Test Ping result feedback if active on this card */}
                                                {testPingResult && testPingResult.endpointId === ep.id && (
                                                    <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                                                        testPingResult.success
                                                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                                            : "bg-rose-50/70 border-rose-200 text-rose-800"
                                                    }`}>
                                                        <div className="flex items-center gap-2">
                                                            {testPingResult.success ? (
                                                                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                                                            )}
                                                            <span>
                                                                {testPingResult.message}
                                                                {testPingResult.httpStatus && ` (HTTP ${testPingResult.httpStatus})`}
                                                                {testPingResult.durationMs && ` in ${testPingResult.durationMs}ms`}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => setTestPingResult(null)}
                                                            className="text-xs underline font-medium cursor-pointer"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTestPing(ep)}
                                                    disabled={testPingMutation.isPending}
                                                    className="h-8 px-3 rounded-lg text-xs font-semibold border-[#E5E9EE] text-[#172033] hover:bg-slate-50 cursor-pointer shadow-2xs hover:border-[#2F8F83] hover:text-[#2F8F83]"
                                                >
                                                    <Send size={12} className={`mr-1.5 ${isTesting ? "animate-spin text-[#2F8F83]" : "text-[#5F6B7A]"}`} />
                                                    {isTesting ? "Testing..." : "Test Ping"}
                                                </Button>

                                                <Link href={`/developer/webhook-logs?endpoint_id=${ep.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs font-medium text-[#5F6B7A] hover:text-[#172033] rounded-lg cursor-pointer"
                                                        title="View Logs"
                                                    >
                                                        <Activity size={13} className="mr-1 text-[#8A95A3]" />
                                                        Logs
                                                    </Button>
                                                </Link>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-[#8A95A3] hover:text-[#172033] rounded-lg cursor-pointer"
                                                        >
                                                            <MoreVertical size={15} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl text-xs">
                                                        <DropdownMenuItem
                                                            onClick={() => handleOpenEdit(ep)}
                                                            className="cursor-pointer flex items-center gap-2 text-xs"
                                                        >
                                                            <Edit3 size={13} className="text-slate-500" />
                                                            Edit Configuration
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleStatus(ep)}
                                                            className="cursor-pointer flex items-center gap-2 text-xs"
                                                        >
                                                            {ep.status === "active" ? (
                                                                <>
                                                                    <PauseCircle size={13} className="text-amber-500" />
                                                                    Pause Webhook
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlayCircle size={13} className="text-emerald-500" />
                                                                    Resume Webhook
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem
                                                            onClick={() => setRotatingEndpoint(ep)}
                                                            className="cursor-pointer flex items-center gap-2 text-xs text-amber-700"
                                                        >
                                                            <Key size={13} className="text-amber-600" />
                                                            Regenerate Secret
                                                        </DropdownMenuItem>

                                                        <DropdownMenuSeparator />

                                                        <DropdownMenuItem
                                                            onClick={() => setDeletingEndpoint(ep)}
                                                            className="cursor-pointer flex items-center gap-2 text-xs text-rose-600 focus:text-rose-700"
                                                        >
                                                            <Trash2 size={13} />
                                                            Delete Endpoint
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Developer Documentation Card */}
                <Card className="border border-[#E5E9EE] bg-white rounded-xl shadow-2xs overflow-hidden">
                    <CardHeader
                        className="py-4 px-6 flex flex-row items-center justify-between cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                        onClick={() => setShowDocs(!showDocs)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center font-bold">
                                <Code2 size={16} />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-[#172033]">Webhook Signature Verification Guide</CardTitle>
                                <CardDescription className="text-xs text-[#5F6B7A]">
                                    How to verify payload signatures using HMAC-SHA256 in Node.js, PHP, or Python
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#8A95A3]">
                            {showDocs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                    </CardHeader>

                    {showDocs && (
                        <CardContent className="p-6 border-t border-[#E5E9EE] text-xs space-y-5 bg-[#F7F9FA]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 p-3.5 bg-white border border-[#E5E9EE] rounded-xl">
                                    <p className="font-bold text-[#172033] flex items-center gap-1.5">
                                        <Lock size={13} className="text-[#2F8F83]" />
                                        Request Headers
                                    </p>
                                    <ul className="space-y-1 font-mono text-[11px] text-[#5F6B7A]">
                                        <li><code>X-Connectly-Signature</code>: t=&lt;timestamp&gt;,v1=&lt;hmac&gt;</li>
                                        <li><code>X-Connectly-Event-Id</code>: evt_01J... (Idempotency Key)</li>
                                        <li><code>X-Connectly-Event-Type</code>: message.received</li>
                                        <li><code>X-Connectly-Timestamp</code>: 1728290000</li>
                                        <li><code>X-Connectly-Version</code>: 2026-01-01</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 p-3.5 bg-white border border-slate-200/70 rounded-xl">
                                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                        <CheckCircle2 size={13} className="text-emerald-600" />
                                        Verification Algorithm
                                    </p>
                                    <p className="text-slate-600 leading-relaxed text-[11px]">
                                        Extract the timestamp <code className="font-mono bg-slate-100 px-1 rounded">t</code> and signature <code className="font-mono bg-slate-100 px-1 rounded">v1</code> from the header.
                                        Compute HMAC-SHA256 over <code className="font-mono bg-slate-100 px-1 rounded">{"${timestamp}.${raw_payload}"}</code> using your endpoint secret.
                                        Compare using constant-time comparison.
                                    </p>
                                </div>
                            </div>

                            {/* Code Examples */}
                            <div className="space-y-3">
                                <div className="font-semibold text-slate-800">Verification Code Example (Node.js)</div>
                                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`const crypto = require("crypto");

function verifyWebhookSignature(rawBody, signatureHeader, secret) {
    const parts = Object.fromEntries(
        signatureHeader.split(",").map(p => p.split("="))
    );
    const timestamp = parts.t;
    const receivedSig = parts.v1;

    // Check timestamp tolerance (e.g. 5 minutes)
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
        return false;
    }

    const payloadToSign = \`\${timestamp}.\${rawBody}\`;
    const expectedSig = crypto
        .createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("hex");

    return crypto.timingSafeEqual(
        Buffer.from(receivedSig, "hex"),
        Buffer.from(expectedSig, "hex")
    );
}`}
                                </pre>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Add / Edit Webhook Dialog */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-xl rounded-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-[#172033]">
                                {editingEndpoint ? "Edit Webhook Endpoint" : "Add Webhook Endpoint"}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#5F6B7A]">
                                Enter your HTTPS destination URL and choose which real-time platform events should be delivered.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEndpoint} className="space-y-5 pt-2">
                            {/* Webhook Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="ep-name" className="text-xs font-bold text-[#172033]">
                                    Webhook Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="ep-name"
                                    required
                                    placeholder="e.g. Production CRM, Order System"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="rounded-lg border-[#E5E9EE] text-xs focus:border-[#2F8F83]"
                                />
                            </div>

                            {/* Endpoint URL */}
                            <div className="space-y-1.5">
                                <Label htmlFor="ep-url" className="text-xs font-bold text-[#172033]">
                                    Endpoint URL (HTTPS) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="ep-url"
                                    type="url"
                                    required
                                    placeholder="https://api.yourdomain.com/webhooks/connectly360"
                                    value={formUrl}
                                    onChange={(e) => setFormUrl(e.target.value)}
                                    className="rounded-lg border-[#E5E9EE] text-xs font-mono focus:border-[#2F8F83]"
                                />
                                <p className="text-[10px] text-[#8A95A3]">
                                    Must be a valid HTTPS URL. SSRF protection prevents loopback and private networks.
                                </p>
                            </div>

                            {/* Event Subscriptions */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-[#172033]">
                                        Subscribed Events <span className="text-rose-500">*</span>
                                    </Label>
                                    <span className="text-[11px] text-[#2F8F83] font-medium">
                                        {selectedEvents.length} selected
                                    </span>
                                </div>

                                <div className="border border-[#E5E9EE] rounded-xl p-3 max-h-56 overflow-y-auto space-y-4 bg-[#F7F9FA]">
                                    {isEventsLoading ? (
                                        <div className="space-y-2 p-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    ) : (
                                        groupedCategoriesList.map(({ name: category, events }) => {
                                            const allSelected = events.length > 0 && events.every((ev) => selectedEvents.includes(ev.key));

                                            return (
                                                <div key={category} className="space-y-2">
                                                    <div className="flex items-center justify-between border-b border-[#E5E9EE] pb-1">
                                                        <span className="text-[11px] font-bold text-[#172033] uppercase tracking-wider">
                                                            {category}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleCategory(events)}
                                                            className="text-[10px] text-[#2F8F83] hover:underline font-semibold cursor-pointer"
                                                        >
                                                            {allSelected ? "Deselect All" : "Select All"}
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {events.map((ev) => {
                                                            const isChecked = selectedEvents.includes(ev.key);
                                                            return (
                                                                <label
                                                                    key={ev.key}
                                                                    className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                                                        isChecked
                                                                            ? "bg-[#E8F6F3] border-[#BFE4DD] text-[#172033]"
                                                                            : "bg-white border-[#E5E9EE] text-[#5F6B7A] hover:bg-slate-50"
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => handleToggleEvent(ev.key)}
                                                                        className="rounded text-[#2F8F83] focus:ring-[#2F8F83] mt-0.5"
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-[11px] font-mono leading-tight">{ev.key}</p>
                                                                        <p className="text-[10px] text-[#8A95A3] leading-tight mt-0.5 truncate">{ev.description}</p>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Description (Optional) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="ep-desc" className="text-xs font-bold text-[#172033]">
                                    Description <span className="text-[#8A95A3] font-normal">(Optional)</span>
                                </Label>
                                <Input
                                    id="ep-desc"
                                    placeholder="Internal notes about this endpoint integration"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    className="rounded-lg border-[#E5E9EE] text-xs focus:border-[#2F8F83]"
                                />
                            </div>

                            {/* Custom Headers (Optional) */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-[#172033]">
                                        Custom Headers <span className="text-[#8A95A3] font-normal">(Optional)</span>
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={handleAddHeaderRow}
                                        className="text-[11px] text-[#2F8F83] hover:underline font-semibold cursor-pointer"
                                    >
                                        + Add Header
                                    </button>
                                </div>

                                {customHeadersList.length > 0 && (
                                    <div className="space-y-2">
                                        {customHeadersList.map((header, idx) => (
                                             <div key={idx} className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Header Name (e.g. X-Api-Key)"
                                                    value={header.key}
                                                    onChange={(e) => handleUpdateHeaderRow(idx, "key", e.target.value)}
                                                    className="rounded-lg border-[#E5E9EE] text-xs h-8 focus:border-[#2F8F83]"
                                                />
                                                <Input
                                                    placeholder="Header Value"
                                                    value={header.value}
                                                    onChange={(e) => handleUpdateHeaderRow(idx, "value", e.target.value)}
                                                    className="rounded-lg border-[#E5E9EE] text-xs h-8 focus:border-[#2F8F83]"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveHeaderRow(idx)}
                                                    className="h-8 w-8 p-0 text-[#8A95A3] hover:text-rose-600 rounded-lg"
                                                >
                                                    <Trash2 size={13} />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="pt-3 border-t border-[#E5E9EE]">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddOpen(false)}
                                    className="rounded-lg text-xs border-[#E5E9EE] hover:border-[#2F8F83] hover:text-[#2F8F83]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer h-9 px-4"
                                >
                                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingEndpoint ? "Update Endpoint" : "Register Endpoint"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* One-Time Secret Reveal Modal */}
                <Dialog open={!!revealedSecret} onOpenChange={(open) => !open && setRevealedSecret(null)}>
                    <DialogContent className="sm:max-w-md rounded-xl">
                        <DialogHeader>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                                <Key size={20} />
                            </div>
                            <DialogTitle className="text-base font-bold text-[#172033]">
                                Webhook Signing Secret
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#5F6B7A]">
                                Endpoint: <strong className="text-[#172033]">{revealedSecret?.name}</strong>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Save this secret now</p>
                                    <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                                        For security reasons, this signing secret is encrypted and will <strong>NEVER</strong> be displayed again. Store it securely in your environment variables.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-[#172033]">Signing Secret</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto select-all">
                                        {revealedSecret?.secret}
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (revealedSecret?.secret) {
                                                copyToClipboard(revealedSecret.secret, "Secret copied to clipboard");
                                                setHasCopiedSecret(true);
                                            }
                                        }}
                                        className="h-9 px-3 bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
                                    >
                                        {hasCopiedSecret ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                                        {hasCopiedSecret ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                onClick={() => setRevealedSecret(null)}
                                className="w-full bg-[#172033] hover:bg-[#25324d] text-white rounded-lg text-xs font-bold h-9"
                            >
                                Done, I have saved the secret
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirm Delete Dialog */}
                <ConfirmDialog
                    open={!!deletingEndpoint}
                    onOpenChange={(open) => !open && setDeletingEndpoint(null)}
                    title="Delete Webhook Endpoint?"
                    description={`Future events will no longer be delivered to "${deletingEndpoint?.name}" (${deletingEndpoint?.url}). Existing delivery history logs will be retained according to your retention policy.`}
                    confirmText="Delete Endpoint"
                    variant="destructive"
                    loading={deleteMutation.isPending}
                    onConfirm={handleConfirmDelete}
                />

                {/* Confirm Rotate Secret Dialog */}
                <ConfirmDialog
                    open={!!rotatingEndpoint}
                    onOpenChange={(open) => !open && setRotatingEndpoint(null)}
                    title="Regenerate Webhook Secret?"
                    description={`Regenerating this secret will invalidate the current signing secret immediately for "${rotatingEndpoint?.name}". Any endpoint verifying signatures with the old secret will fail until updated with the new secret.`}
                    confirmText="Regenerate Secret"
                    variant="destructive"
                    loading={rotateSecretMutation.isPending}
                    onConfirm={handleConfirmRotateSecret}
                />
            </div>
        </UpgradeGuard>
    );
}
