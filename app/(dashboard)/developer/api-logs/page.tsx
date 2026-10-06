"use client";

import React, { useState } from "react";
import {
    Terminal,
    Search,
    RefreshCw,
    Filter,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowUpRight
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

interface ApiLogItem {
    id: string;
    method: "GET" | "POST" | "PATCH" | "DELETE";
    endpoint: string;
    statusCode: number;
    responseTime: string;
    timestamp: string;
    ipAddress: string;
}

const SAMPLE_LOGS: ApiLogItem[] = [
    { id: "log_101", method: "POST", endpoint: "/v1/whatsapp/send", statusCode: 200, responseTime: "112ms", timestamp: "2 mins ago", ipAddress: "192.168.1.45" },
    { id: "log_102", method: "GET", endpoint: "/v1/customers", statusCode: 200, responseTime: "84ms", timestamp: "5 mins ago", ipAddress: "192.168.1.45" },
    { id: "log_103", method: "POST", endpoint: "/v1/webhooks/whatsapp", statusCode: 200, responseTime: "98ms", timestamp: "12 mins ago", ipAddress: "31.13.75.12" },
    { id: "log_104", method: "POST", endpoint: "/v1/campaigns/send", statusCode: 429, responseTime: "45ms", timestamp: "30 mins ago", ipAddress: "192.168.1.45" },
    { id: "log_105", method: "GET", endpoint: "/v1/analytics/summary", statusCode: 200, responseTime: "160ms", timestamp: "1 hour ago", ipAddress: "192.168.1.45" }
];

export default function ApiLogsPage() {
    const [logs, setLogs] = useState<ApiLogItem[]>(SAMPLE_LOGS);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const filteredLogs = logs.filter(
        (l) =>
            l.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.statusCode.toString().includes(searchQuery)
    );

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
                        onClick={handleRefresh}
                        className="rounded-xl border-slate-200 text-xs font-semibold cursor-pointer h-9 px-4"
                    >
                        <RefreshCw size={14} className={`mr-1.5 ${isRefreshing ? "animate-spin text-[#35877D]" : "text-slate-500"}`} />
                        Refresh Logs
                    </Button>
                }
            />

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filter by endpoint, status code or method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#35877D]"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Method</th>
                                <th className="px-4 py-3">Endpoint</th>
                                <th className="px-4 py-3">Latency</th>
                                <th className="px-4 py-3">IP Address</th>
                                <th className="px-4 py-3">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                                                log.statusCode < 300
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                            }`}
                                        >
                                            {log.statusCode < 300 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                            {log.statusCode}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-slate-900 font-bold">{log.method}</span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-900">{log.endpoint}</td>
                                    <td className="px-4 py-3 text-slate-500">{log.responseTime}</td>
                                    <td className="px-4 py-3 font-mono text-slate-500">{log.ipAddress}</td>
                                    <td className="px-4 py-3 text-slate-400">{log.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
