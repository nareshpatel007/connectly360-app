"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Download,
    FileSpreadsheet,
    FileText,
    Database,
    ShieldCheck,
    Clock,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Lock,
    Users,
    Megaphone,
    MessageSquare,
    Receipt,
    Plus,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface DataExportItem {
    id: number;
    type: "contacts" | "campaigns" | "reports" | "conversations" | "audit_logs";
    format: "csv" | "json";
    status: "pending" | "processing" | "completed" | "failed";
    total_records: number;
    file_name: string | null;
    file_size_human: string | null;
    download_url: string | null;
    error_message: string | null;
    completed_at: string | null;
    created_at: string;
    user: { id: number; name: string; email: string } | null;
}

export default function DataExportsPage() {
    const { user, token } = useAuth();
    const [exports, setExports] = useState<DataExportItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    // Modal state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [exportType, setExportType] = useState<string>("contacts");
    const [exportFormat, setExportFormat] = useState<string>("csv");
    const [dateFrom, setDateFrom] = useState<string>("");
    const [dateTo, setDateTo] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getAuthToken = () => {
        return token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
    };

    const fetchExports = async (showRefresh = false) => {
        const authToken = getAuthToken();
        if (!authToken) {
            setIsLoading(false);
            return;
        }

        if (showRefresh) setIsRefreshing(true);
        try {
            const res = await fetch("/api/exports", {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
                setExports(json.data);
            }
        } catch {
            toast.error("Failed to fetch export history");
        } finally {
            setIsLoading(false);
            if (showRefresh) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const authToken = getAuthToken();
        if (authToken) {
            fetchExports();
        }
    }, [token]);

    // Polling if any export is pending/processing
    useEffect(() => {
        const hasActiveJobs = exports.some(e => e.status === "pending" || e.status === "processing");
        if (!hasActiveJobs) return;

        const interval = setInterval(() => {
            fetchExports();
        }, 3000);

        return () => clearInterval(interval);
    }, [exports, token]);

    const handleCreateExport = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const authToken = getAuthToken();
            if (!authToken) {
                toast.error("You must be logged in to request an export");
                setIsSubmitting(false);
                return;
            }

            const filters: any = {};
            if (dateFrom) filters.date_from = dateFrom;
            if (dateTo) filters.date_to = dateTo;

            const res = await fetch("/api/exports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    type: exportType,
                    format: exportFormat,
                    filters,
                }),
            });

            const json = await res.json();
            if (json.success) {
                toast.success(json.message || "Export initiated successfully");
                setIsCreateOpen(false);
                fetchExports();
            } else {
                toast.error(json.message || "Failed to initiate export");
            }
        } catch {
            toast.error("Network error while creating export request");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownload = async (item: DataExportItem) => {
        try {
            setDownloadingId(item.id);
            const authToken = getAuthToken();
            const downloadUrl = `/api/exports/${item.id}/download${authToken ? `?token=${encodeURIComponent(authToken)}` : ""}`;
            const res = await fetch(downloadUrl, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.message || "Failed to download export file");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = item.file_name || `export_${item.type}_${item.id}.${item.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Download started");
        } catch (err: any) {
            toast.error(err.message || "Failed to download export file");
        } finally {
            setDownloadingId(null);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "contacts":
                return <Users size={16} className="text-[#2F8F83]" />;
            case "campaigns":
                return <Megaphone size={16} className="text-blue-600" />;
            case "reports":
                return <Receipt size={16} className="text-amber-600" />;
            case "conversations":
                return <MessageSquare size={16} className="text-purple-600" />;
            default:
                return <Database size={16} className="text-slate-600" />;
        }
    };

    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={Database}
                title="Data Exports & Privacy"
                description="Export workspace datasets (contacts, campaigns, credit ledger, and conversation transcripts) with asynchronous queueing and GDPR privacy audit compliance."
                breadcrumbs={[
                    { label: "Reports", href: "/reports" },
                    { label: "Data Exports" }
                ]}
                actions={
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg shadow-2xs flex items-center gap-2 cursor-pointer font-semibold text-xs h-9 px-4"
                    >
                        <Plus size={16} />
                        Request New Export
                    </Button>
                }
            />

            {/* Privacy & Legal Compliance Banner */}
            <div className="bg-[#E8F6F3] border border-[#BFE4DD] rounded-xl p-4 flex items-start gap-3 text-[#172033]">
                <ShieldCheck className="text-[#2F8F83] shrink-0 mt-0.5" size={20} />
                <div className="text-xs space-y-0.5">
                    <p className="font-bold text-[#172033]">GDPR & Data Privacy Compliance Notice</p>
                    <p className="text-[#5F6B7A] leading-relaxed">
                        Data exports contain customer Personally Identifiable Information (PII). In accordance with GDPR and workspace security policy, every export request is logged to the immutable workspace audit trail with actor identity and timestamp. Exports automatically expire and are purged after 7 days.
                    </p>
                </div>
            </div>

            {/* Export History Card */}
            <Card className="border border-[#E5E9EE] bg-white rounded-xl shadow-2xs overflow-hidden">
                <CardHeader className="border-b border-[#E5E9EE] pb-4 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-bold text-[#172033]">Workspace Export History</CardTitle>
                        <CardDescription className="text-xs text-[#5F6B7A]">
                            Recent synchronous and background export jobs generated by workspace administrators.
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchExports(true)}
                        className="h-8 px-2.5 border-[#E5E9EE] rounded-lg text-[#5F6B7A] cursor-pointer hover:border-[#2F8F83] hover:text-[#2F8F83]"
                        title="Refresh"
                    >
                        <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#2F8F83]" : ""} />
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="divide-y divide-[#E5E9EE] p-4 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between pt-2">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48 rounded-md" />
                                        <Skeleton className="h-3 w-32 rounded-md" />
                                    </div>
                                    <Skeleton className="h-8 w-24 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : exports.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                            <div className="h-14 w-14 rounded-2xl bg-[#E8F6F3] border border-[#BFE4DD] flex items-center justify-center mb-3">
                                <Database size={26} className="text-[#2F8F83]" />
                            </div>
                            <p className="text-sm font-bold text-[#172033]">No exports generated yet</p>
                            <p className="text-xs text-[#5F6B7A] max-w-sm mt-1 leading-relaxed">
                                Request a data export to extract contacts, marketing campaigns, reports, or customer transcripts in CSV format.
                            </p>
                            <Button
                                onClick={() => setIsCreateOpen(true)}
                                className="mt-4 bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-semibold cursor-pointer h-9 px-4"
                            >
                                <Plus size={14} className="mr-1.5" />
                                Request New Export
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E5E9EE]">
                            {exports.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5 font-bold text-xs text-[#172033]">
                                                {getTypeIcon(item.type)}
                                                <span className="capitalize">{item.type.replace("_", " ")} Export</span>
                                            </div>

                                            <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-slate-100 border-slate-300">
                                                {item.format}
                                            </Badge>

                                            {/* Status Badge */}
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    item.status === "completed"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : item.status === "processing" || item.status === "pending"
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                }`}
                                            >
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-[#8A95A3] flex-wrap">
                                            <span>Requested: {new Date(item.created_at).toLocaleString()}</span>
                                            {item.user && (
                                                <>
                                                    <span>•</span>
                                                    <span>By: <strong className="text-[#172033]">{item.user.name}</strong></span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>Records: <strong>{item.total_records.toLocaleString()}</strong></span>
                                            {item.file_size_human && (
                                                <>
                                                    <span>•</span>
                                                    <span>Size: {item.file_size_human}</span>
                                                </>
                                            )}
                                        </div>

                                        {item.error_message && (
                                            <p className="text-[11px] text-rose-600 font-medium">
                                                Error: {item.error_message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="shrink-0">
                                        {item.status === "completed" ? (
                                            <button
                                                onClick={() => handleDownload(item)}
                                                disabled={downloadingId === item.id}
                                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold bg-[#2F8F83] hover:bg-[#267A70] text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                            >
                                                {downloadingId === item.id ? (
                                                    <RefreshCw size={13} className="animate-spin" />
                                                ) : (
                                                    <Download size={13} />
                                                )}
                                                Download {item.format.toUpperCase()}
                                            </button>
                                        ) : item.status === "processing" || item.status === "pending" ? (
                                            <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                                                <RefreshCw size={12} className="animate-spin text-amber-600" />
                                                Processing...
                                            </div>
                                        ) : (
                                            <span className="text-xs text-rose-600 font-medium">Failed</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Request Export Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md rounded-xl bg-white p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-[#172033] flex items-center gap-2">
                            <Download className="text-[#2F8F83]" size={18} />
                            Request Data Export
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#5F6B7A]">
                            Select the dataset, format, and optional date filters for export. Large datasets (&gt; 500 rows) are processed in background jobs.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateExport} className="space-y-4 pt-2">
                        {/* Dataset Type */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#172033]">
                                Dataset to Export <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E9EE] rounded-lg text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#2F8F83] focus:bg-white cursor-pointer"
                            >
                                <option value="contacts">Contacts & Customers (Full directory + Attributes)</option>
                                <option value="campaigns">Marketing Campaigns & Broadcast Analytics</option>
                                <option value="reports">Credit History & Usage Transactions</option>
                                <option value="conversations">Customer Conversation Transcripts (Admin / Owner)</option>
                                <option value="audit_logs">Workspace Security Audit Logs</option>
                            </select>
                        </div>

                        {/* Format */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#172033]">Format</label>
                            <div className="flex gap-3">
                                <label className={`flex-1 p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                                    exportFormat === "csv" ? "border-[#2F8F83] bg-[#E8F6F3] text-[#172033]" : "border-[#E5E9EE] bg-white text-[#5F6B7A]"
                                }`}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="csv"
                                        checked={exportFormat === "csv"}
                                        onChange={() => setExportFormat("csv")}
                                        className="text-[#2F8F83]"
                                    />
                                    <span className="text-xs font-bold">CSV (Excel, Google Sheets)</span>
                                </label>
                                <label className={`flex-1 p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${
                                    exportFormat === "json" ? "border-[#2F8F83] bg-[#E8F6F3] text-[#172033]" : "border-[#E5E9EE] bg-white text-[#5F6B7A]"
                                }`}>
                                    <input
                                        type="radio"
                                        name="format"
                                        value="json"
                                        checked={exportFormat === "json"}
                                        onChange={() => setExportFormat("json")}
                                        className="text-[#2F8F83]"
                                    />
                                    <span className="text-xs font-bold">JSON (Developers / APIs)</span>
                                </label>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#5F6B7A]">From (Optional)</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E9EE] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2F8F83]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#5F6B7A]">To (Optional)</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E9EE] rounded-lg text-xs text-[#172033] focus:outline-none focus:border-[#2F8F83]"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-[#E5E9EE]">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                className="rounded-lg text-xs font-semibold border-[#E5E9EE]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-semibold h-9 px-4 cursor-pointer"
                            >
                                {isSubmitting ? "Queueing..." : "Generate Export"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
