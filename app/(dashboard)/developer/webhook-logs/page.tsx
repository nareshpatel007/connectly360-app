"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    Activity,
    Webhook,
    Search,
    Filter,
    RefreshCw,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    Clock,
    XCircle,
    Copy,
    Check,
    ExternalLink,
    Code2,
    Calendar,
    ArrowUpRight,
    Server,
    FileText,
    History,
    SlidersHorizontal,
    X,
    Eye
} from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/ui/error-state";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
    useWebhookLogs,
    useWebhookLogDetail,
    useRetryWebhookDelivery,
    useWebhookEndpoints,
    useWebhookEvents,
    WebhookDeliveryLogItem
} from "@/lib/api-client-react";

function WebhookLogsContent() {
    const searchParams = useSearchParams();
    const initialEndpointId = searchParams.get("endpoint_id") || "all";

    const { user } = useAuth();
    const { can, isOwner } = usePermissions();
    const workspaceId = user?.tenant_id;

    // RBAC check
    const canRetry = isOwner || can("developer.webhooks.manage") || can("developer.webhooks.retry") || can("developer.manage");

    // Filter states
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [endpointFilter, setEndpointFilter] = useState<string>(initialEndpointId);
    const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Detail drawer state
    const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
    const [hasCopiedPayload, setHasCopiedPayload] = useState(false);
    const [hasCopiedEventId, setHasCopiedEventId] = useState(false);

    // Queries
    const {
        data: endpoints = []
    } = useWebhookEndpoints(workspaceId);

    const {
        data: categoriesData = {}
    } = useWebhookEvents(workspaceId);

    // Flatten event list for filter dropdown
    const allRegisteredEvents = useMemo(() => {
        const list: { key: string; label: string }[] = [];
        Object.values(categoriesData).forEach((events) => {
            events.forEach((ev) => {
                list.push({ key: ev.key, label: ev.label });
            });
        });
        return list;
    }, [categoriesData]);

    // Logs query
    const {
        data: logsData,
        isLoading: isLogsLoading,
        isError: isLogsError,
        refetch: refetchLogs,
        isFetching: isLogsFetching
    } = useWebhookLogs({
        workspaceId,
        page,
        per_page: perPage,
        endpoint_id: endpointFilter !== "all" ? endpointFilter : undefined,
        event_type: eventTypeFilter !== "all" ? eventTypeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined,
    });

    // Detail query
    const {
        data: logDetail,
        isLoading: isDetailLoading
    } = useWebhookLogDetail(selectedLogId, workspaceId);

    // Retry mutation
    const retryMutation = useRetryWebhookDelivery(workspaceId);

    // Handle search change with simple enter/blur or instant submit
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }
    };

    const handleApplySearch = () => {
        setDebouncedSearch(searchQuery);
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setEndpointFilter("all");
        setEventTypeFilter("all");
        setStatusFilter("all");
        setPage(1);
    };

    // Retry action
    const handleRetry = async (logId: number) => {
        try {
            await retryMutation.mutateAsync(logId);
            toast.success("Delivery retry queued successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger retry");
        }
    };

    // Copy helper
    const copyToClipboard = (text: string, type: "payload" | "event_id") => {
        navigator.clipboard.writeText(text);
        if (type === "payload") {
            setHasCopiedPayload(true);
            setTimeout(() => setHasCopiedPayload(false), 2000);
        } else {
            setHasCopiedEventId(true);
            setTimeout(() => setHasCopiedEventId(false), 2000);
        }
        toast.success("Copied to clipboard");
    };

    // Status badge formatter
    const renderStatusBadge = (status: string, httpStatus?: number | null) => {
        switch (status) {
            case "delivered":
                return (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold px-2 py-0.5 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        Delivered {httpStatus ? `(${httpStatus})` : ""}
                    </Badge>
                );
            case "retrying":
                return (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold px-2 py-0.5 flex items-center gap-1 w-fit">
                        <Clock size={11} className="text-amber-600 animate-spin" />
                        Retrying {httpStatus ? `(${httpStatus})` : ""}
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-semibold px-2 py-0.5 flex items-center gap-1 w-fit">
                        <XCircle size={11} className="text-rose-600" />
                        Failed {httpStatus ? `(${httpStatus})` : ""}
                    </Badge>
                );
            case "pending":
            case "processing":
                return (
                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-semibold px-2 py-0.5 flex items-center gap-1 w-fit">
                        <Clock size={11} className="text-blue-500" />
                        Queued
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-semibold px-2 py-0.5 flex items-center gap-1 w-fit">
                        Cancelled
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600 border-slate-200 font-semibold px-2 py-0.5 w-fit">
                        {status}
                    </Badge>
                );
        }
    };

    const logs = logsData?.data || [];
    const totalCount = logsData?.total || 0;
    const lastPage = logsData?.last_page || 1;

    return (
        <UpgradeGuard
            allowedPlans={["growth", "business", "enterprise"]}
            featureName="Webhooks"
            description="Inspect outgoing real-time webhook deliveries, HTTP response status codes, payload structures, and retry attempts."
        >
            <div className="space-y-6">
                <PageHeader
                    icon={Activity}
                    title="Webhook Logs"
                    description="Monitor webhook delivery attempts, responses, failures, and retries in real time."
                    breadcrumbs={[
                        { label: "Developer", href: "/developer" },
                        { label: "Webhooks", href: "/developer/webhooks" },
                        { label: "Logs" }
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            <Link href="/developer/webhooks">
                                <Button
                                    variant="outline"
                                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                >
                                    <Webhook size={14} className="text-[#35877D]" />
                                    Manage Endpoints
                                </Button>
                            </Link>

                            <Button
                                variant="outline"
                                onClick={() => refetchLogs()}
                                className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                title="Refresh Logs"
                            >
                                <RefreshCw size={13} className={isLogsFetching ? "animate-spin text-[#35877D]" : "text-slate-500"} />
                                Refresh
                            </Button>
                        </div>
                    }
                />

                {/* Filters & Search Card */}
                <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Search Event ID, URL, or error..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    onBlur={handleApplySearch}
                                    className="pl-9 rounded-xl border-slate-200 text-xs h-9"
                                />
                            </div>

                            {/* Endpoint Filter */}
                            <div>
                                <Select
                                    value={endpointFilter}
                                    onValueChange={(val) => {
                                        setEndpointFilter(val);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 text-xs h-9">
                                        <SelectValue placeholder="All Endpoints" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl text-xs">
                                        <SelectItem value="all">All Endpoints</SelectItem>
                                        {endpoints.map((ep) => (
                                            <SelectItem key={ep.id} value={String(ep.id)}>
                                                {ep.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Event Type Filter */}
                            <div>
                                <Select
                                    value={eventTypeFilter}
                                    onValueChange={(val) => {
                                        setEventTypeFilter(val);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 text-xs h-9">
                                        <SelectValue placeholder="All Events" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl text-xs max-h-56">
                                        <SelectItem value="all">All Events</SelectItem>
                                        {allRegisteredEvents.map((ev) => (
                                            <SelectItem key={ev.key} value={ev.key}>
                                                {ev.key}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(val) => {
                                        setStatusFilter(val);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 text-xs h-9">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl text-xs">
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="pending">Pending / Queued</SelectItem>
                                        <SelectItem value="retrying">Retrying</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Active filter pills / clear */}
                        {(debouncedSearch || endpointFilter !== "all" || eventTypeFilter !== "all" || statusFilter !== "all") && (
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-700">Active filters:</span>
                                    {debouncedSearch && (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] gap-1">
                                            Search: {debouncedSearch}
                                        </Badge>
                                    )}
                                    {endpointFilter !== "all" && (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] gap-1">
                                            Endpoint ID: {endpointFilter}
                                        </Badge>
                                    )}
                                    {eventTypeFilter !== "all" && (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] gap-1">
                                            Event: {eventTypeFilter}
                                        </Badge>
                                    )}
                                    {statusFilter !== "all" && (
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] gap-1">
                                            Status: {statusFilter}
                                        </Badge>
                                    )}
                                </div>
                                <button
                                    onClick={handleClearFilters}
                                    className="text-xs text-[#35877D] hover:underline font-semibold cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Log Table Card */}
                <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 py-3.5 px-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">
                                Delivery History
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Showing {logs.length} of {totalCount} total webhook deliveries
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLogsLoading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                ))}
                            </div>
                        ) : isLogsError ? (
                            <div className="p-8">
                                <ErrorState
                                    title="Unable to load webhook logs"
                                    description="Failed to retrieve delivery log entries from the server."
                                    onRetry={() => refetchLogs()}
                                />
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                    <History size={24} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">No delivery logs found</h3>
                                <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                                    Outgoing webhook deliveries matching your filter criteria will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-600 font-bold">
                                            <th className="py-3 px-4">Event Type</th>
                                            <th className="py-3 px-4">Destination Endpoint</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Attempts</th>
                                            <th className="py-3 px-4">Latency</th>
                                            <th className="py-3 px-4">Time</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.map((log) => {
                                            const endpointName = log.endpoint?.name || log.endpoint_name || "Endpoint";
                                            const endpointUrl = log.endpoint?.url || log.endpoint_url || "";

                                            return (
                                                <tr
                                                    key={log.id}
                                                    onClick={() => setSelectedLogId(log.id)}
                                                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                                                >
                                                    {/* Event Type & ID */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="font-mono font-bold text-slate-900 text-xs">
                                                            {log.event_type}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                                                            {log.event_id}
                                                        </div>
                                                    </td>

                                                    {/* Destination Endpoint */}
                                                    <td className="py-3.5 px-4 max-w-[200px]">
                                                        <div className="font-semibold text-slate-800 truncate">
                                                            {endpointName}
                                                        </div>
                                                        <div className="font-mono text-[10px] text-slate-400 truncate">
                                                            {endpointUrl}
                                                        </div>
                                                    </td>

                                                    {/* Status & HTTP code */}
                                                    <td className="py-3.5 px-4">
                                                        {renderStatusBadge(log.status, log.http_status)}
                                                    </td>

                                                    {/* Attempts */}
                                                    <td className="py-3.5 px-4 font-medium text-slate-700">
                                                        {log.attempt_count} {log.attempt_count === 1 ? "attempt" : "attempts"}
                                                    </td>

                                                    {/* Duration */}
                                                    <td className="py-3.5 px-4 font-mono text-slate-600">
                                                        {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                                                    </td>

                                                    {/* Created / Delivered */}
                                                    <td className="py-3.5 px-4 text-slate-500">
                                                        {new Date(log.created_at).toLocaleString([], {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedLogId(log.id)}
                                                                className="h-7 px-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                                                            >
                                                                <Eye size={12} className="mr-1 text-slate-400" />
                                                                Inspect
                                                            </Button>

                                                            {canRetry && (log.status === "failed" || log.status === "retrying") && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleRetry(log.id)}
                                                                    disabled={retryMutation.isPending}
                                                                    className="h-7 px-2 text-[11px] font-semibold border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer"
                                                                    title="Retry delivery now"
                                                                >
                                                                    <RotateCw size={11} className="mr-1" />
                                                                    Retry
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Bar */}
                        {lastPage > 1 && (
                            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                                <div>
                                    Page <span className="font-bold">{page}</span> of <span className="font-bold">{lastPage}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                        disabled={page <= 1}
                                        className="h-8 px-2.5 rounded-lg border-slate-200"
                                    >
                                        <ChevronLeft size={14} className="mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(p + 1, lastPage))}
                                        disabled={page >= lastPage}
                                        className="h-8 px-2.5 rounded-lg border-slate-200"
                                    >
                                        Next
                                        <ChevronRight size={14} className="ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delivery Inspection Sheet / Drawer */}
                <Sheet open={!!selectedLogId} onOpenChange={(open) => !open && setSelectedLogId(null)}>
                    <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-white">
                        <SheetHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between pr-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <SheetTitle className="text-base font-bold text-slate-900 font-mono">
                                            {logDetail?.event_type || "Webhook Delivery"}
                                        </SheetTitle>
                                        {logDetail && renderStatusBadge(logDetail.status, logDetail.http_status)}
                                    </div>
                                    <SheetDescription className="text-xs text-slate-500 font-mono">
                                        Event ID: {logDetail?.event_id}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                        {isDetailLoading || !logDetail ? (
                            <div className="p-6 space-y-4 flex-1">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                {/* Summary stats grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">HTTP Status</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{logDetail.http_status || "None"}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Latency</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{logDetail.duration_ms ? `${logDetail.duration_ms}ms` : "-"}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Attempts</span>
                                        <p className="font-bold text-slate-900 mt-0.5">{logDetail.attempt_count}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Destination</span>
                                        <p className="font-bold text-slate-900 mt-0.5 truncate">{logDetail.endpoint?.name || "Endpoint"}</p>
                                    </div>
                                </div>

                                {/* Endpoint URL */}
                                <div className="space-y-1 text-xs">
                                    <span className="font-semibold text-slate-700">Target Endpoint URL</span>
                                    <div className="p-2.5 bg-slate-100/70 rounded-xl font-mono text-[11px] text-slate-800 break-all select-all">
                                        {logDetail.endpoint?.url || logDetail.endpoint_url}
                                    </div>
                                </div>

                                {/* Detail Tabs: Overview, Request, Response, Attempts */}
                                <Tabs defaultValue="request" className="w-full">
                                    <TabsList className="grid grid-cols-3 w-full bg-slate-100 rounded-xl p-1">
                                        <TabsTrigger value="request" className="rounded-lg text-xs font-semibold">
                                            Request Payload
                                        </TabsTrigger>
                                        <TabsTrigger value="response" className="rounded-lg text-xs font-semibold">
                                            Response Body
                                        </TabsTrigger>
                                        <TabsTrigger value="attempts" className="rounded-lg text-xs font-semibold">
                                            Attempts ({logDetail.attempts?.length || logDetail.attempt_count})
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Request Tab */}
                                    <TabsContent value="request" className="space-y-4 pt-3">
                                        {/* Headers */}
                                        <div className="space-y-1.5">
                                            <span className="font-semibold text-xs text-slate-700">Request Headers</span>
                                            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                                                {JSON.stringify(logDetail.request_headers || {}, null, 2)}
                                            </pre>
                                        </div>

                                        {/* Body / Payload */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-xs text-slate-700">JSON Payload</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(JSON.stringify(logDetail.payload, null, 2), "payload")}
                                                    className="h-7 px-2 text-[11px] font-semibold text-[#35877D] hover:bg-teal-50"
                                                >
                                                    {hasCopiedPayload ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                                                    {hasCopiedPayload ? "Copied" : "Copy JSON"}
                                                </Button>
                                            </div>
                                            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 select-all leading-relaxed">
                                                {JSON.stringify(logDetail.payload || {}, null, 2)}
                                            </pre>
                                        </div>
                                    </TabsContent>

                                    {/* Response Tab */}
                                    <TabsContent value="response" className="space-y-4 pt-3">
                                        {logDetail.error_message && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                                                <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold">Delivery Error ({logDetail.error_type || "Exception"})</p>
                                                    <p className="text-[11px] text-rose-700 mt-0.5 font-mono">{logDetail.error_message}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <span className="font-semibold text-xs text-slate-700">Response Headers</span>
                                            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                                                {JSON.stringify(logDetail.response_headers || {}, null, 2)}
                                            </pre>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-xs text-slate-700">Response Body</span>
                                                {logDetail.response_truncated && (
                                                    <span className="text-[10px] text-amber-600 font-semibold">(Truncated at 64KB)</span>
                                                )}
                                            </div>
                                            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 select-all leading-relaxed whitespace-pre-wrap">
                                                {logDetail.response_body || "(Empty response body)"}
                                            </pre>
                                        </div>
                                    </TabsContent>

                                    {/* Attempts Timeline Tab */}
                                    <TabsContent value="attempts" className="space-y-3 pt-3">
                                        {!logDetail.attempts || logDetail.attempts.length === 0 ? (
                                            <div className="p-6 text-center text-xs text-slate-400">
                                                No individual attempt breakdown recorded for this delivery.
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {logDetail.attempts.map((att) => (
                                                    <div
                                                        key={att.id}
                                                        className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-2xs"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-800">
                                                                    Attempt #{att.attempt_number}
                                                                </span>
                                                                {att.http_status ? (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[10px] font-semibold ${
                                                                            att.http_status >= 200 && att.http_status < 300
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                                                        }`}
                                                                    >
                                                                        HTTP {att.http_status}
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                                                                        Failed
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <span className="text-slate-400 text-[11px]">
                                                                {att.duration_ms ? `${att.duration_ms}ms` : "-"}
                                                            </span>
                                                        </div>

                                                        {att.error_message && (
                                                            <p className="text-[11px] text-rose-600 font-mono bg-rose-50/50 p-2 rounded-lg border border-rose-100">
                                                                {att.error_message}
                                                            </p>
                                                        )}

                                                        <div className="text-[10px] text-slate-400">
                                                            Started: {new Date(att.started_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                {/* Action Buttons at bottom of sheet */}
                                {canRetry && (logDetail.status === "failed" || logDetail.status === "retrying") && (
                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                                        <Button
                                            onClick={() => handleRetry(logDetail.id)}
                                            disabled={retryMutation.isPending}
                                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                                        >
                                            <RotateCw size={13} className={retryMutation.isPending ? "animate-spin" : ""} />
                                            {retryMutation.isPending ? "Queuing Retry..." : "Retry Delivery Now"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </UpgradeGuard>
    );
}

export default function WebhookLogsPage() {
    return (
        <React.Suspense fallback={<div className="p-8 space-y-4"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
            <WebhookLogsContent />
        </React.Suspense>
    );
}
