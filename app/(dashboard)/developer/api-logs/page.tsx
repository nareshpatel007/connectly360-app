"use client";

import React, { useState, useEffect } from "react";
import {
    Terminal,
    Search,
    RefreshCw,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    Key,
    Shield,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ApiLogItem {
    id: string;
    request_id: string;
    method: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
    endpoint: string;
    status_code: number;
    duration_ms: number;
    timestamp: string;
    created_at: string;
    ip_address: string | null;
    api_key: {
        id: number;
        name: string;
        prefix: string;
    } | null;
}

export default function ApiLogsPage() {
    const [logs, setLogs] = useState<ApiLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLogs = async (refreshIndicator = false) => {
        if (refreshIndicator) setIsRefreshing(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("per_page", "20");
            if (searchQuery.trim()) params.append("search", searchQuery.trim());
            if (statusFilter !== "all") params.append("status_code", statusFilter);

            const res = await fetch(`/api/developer/api-logs?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setLogs(json.data || []);
                if (json.pagination) {
                    setTotalPages(json.pagination.last_page);
                    setTotalCount(json.pagination.total);
                }
            }
        } catch {
        } finally {
            setIsLoading(false);
            if (refreshIndicator) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Terminal}
                title="API Request Logs"
                description="Realtime HTTP request logs, payload diagnostics, and status code telemetry."
                breadcrumbs={[
                    { label: "Developer", href: "/developer" },
                    { label: "API Logs" }
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={() => fetchLogs(true)}
                        className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer h-9 px-4"
                    >
                        <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? "animate-spin text-[#35877D]" : "text-slate-500"}`} />
                        Refresh Logs
                    </Button>
                }
            />

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by endpoint, request ID or path..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#35877D]"
                    />
                </div>

                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                    <button
                        onClick={() => setStatusFilter("all")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                        }`}
                    >
                        All Statuses
                    </button>
                    <button
                        onClick={() => setStatusFilter("200")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === "200" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "hover:text-slate-900"
                        }`}
                    >
                        200 OK
                    </button>
                    <button
                        onClick={() => setStatusFilter("401")}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            statusFilter === "401" ? "bg-white text-rose-700 shadow-2xs font-bold" : "hover:text-slate-900"
                        }`}
                    >
                        401 / 403 Errors
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Method</th>
                                <th className="px-4 py-3">Endpoint</th>
                                <th className="px-4 py-3">Credential / Key</th>
                                <th className="px-4 py-3">Latency</th>
                                <th className="px-4 py-3">IP Address</th>
                                <th className="px-4 py-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">
                                        <div className="space-y-2 max-w-sm mx-auto">
                                            <Skeleton className="h-4 w-full rounded-md" />
                                            <Skeleton className="h-4 w-3/4 rounded-md mx-auto" />
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Terminal size={32} className="mx-auto text-slate-300 mb-2" />
                                        <p className="text-xs font-bold text-slate-600">No API logs found</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Inbound HTTP requests using workspace Bearer tokens will be recorded here.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                                                    log.status_code < 300
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : log.status_code < 400
                                                        ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}
                                            >
                                                {log.status_code < 300 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {log.status_code}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-slate-900 font-bold">{log.method}</span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-900">
                                            {log.endpoint}
                                        </td>
                                        <td className="px-4 py-3">
                                            {log.api_key ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Key size={12} className="text-[#35877D] shrink-0" />
                                                    <span className="font-bold text-slate-800">{log.api_key.name}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">({log.api_key.prefix})</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-[11px] italic">Session / JWT</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-mono">
                                            {log.duration_ms} ms
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-500">
                                            {log.ip_address || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400">
                                            {log.timestamp}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Showing page {page} of {totalPages} ({totalCount} total entries)</span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="h-7 px-2 rounded-lg border-slate-200"
                            >
                                <ChevronLeft size={14} />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="h-7 px-2 rounded-lg border-slate-200"
                            >
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
