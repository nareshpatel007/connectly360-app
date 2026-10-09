"use client";

import { useState } from "react";
import {
    Activity,
    Search,
    Download,
    SlidersHorizontal,
    Users,
    Megaphone,
    MessageCircle,
    FileText,
    UserCheck,
    CreditCard,
    Shield,
    Upload,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    Clock,
    Globe,
    Terminal,
    ArrowRight,
    CheckCircle2,
    RefreshCw
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
    useGetAuditLogs,
    useGetAuditLogCategories,
    AuditLogRecord
} from "@/lib/api-client-react";

const CATEGORY_ICONS: Record<string, any> = {
    contacts: Users,
    exports: Download,
    imports: Upload,
    segments: Filter,
    campaigns: Megaphone,
    waba: MessageCircle,
    templates: FileText,
    assignments: UserCheck,
    billing: CreditCard,
    permissions: Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
    contacts: "text-blue-600 bg-blue-50 border-blue-200",
    exports: "text-amber-600 bg-amber-50 border-amber-200",
    imports: "text-indigo-600 bg-indigo-50 border-indigo-200",
    segments: "text-violet-600 bg-violet-50 border-violet-200",
    campaigns: "text-emerald-600 bg-emerald-50 border-emerald-200",
    waba: "text-teal-600 bg-teal-50 border-teal-200",
    templates: "text-cyan-600 bg-cyan-50 border-cyan-200",
    assignments: "text-orange-600 bg-orange-50 border-orange-200",
    billing: "text-purple-600 bg-purple-50 border-purple-200",
    permissions: "text-rose-600 bg-rose-50 border-rose-200",
};

export default function ActivityLogsPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(15);
    const [activeInspectionLog, setActiveInspectionLog] = useState<AuditLogRecord | null>(null);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Categories query
    const { data: categoriesData, isLoading: isCategoriesLoading } = useGetAuditLogCategories();
    const categoriesMap = categoriesData?.data?.categories || categoriesData?.categories || {};

    // Logs query
    const { data: logsData, isLoading, isFetching, refetch } = useGetAuditLogs({
        category: selectedCategory,
        action: actionFilter,
        search: searchQuery,
        from_date: dateRange === "today" ? new Date().toISOString().split("T")[0] : undefined,
        page: currentPage,
        per_page: perPage,
    });

    const logs: AuditLogRecord[] = logsData?.data || [];
    const pagination = logsData?.pagination || {
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        total: logs.length,
    };

    const handleExportCsv = async () => {
        try {
            setIsExporting(true);
            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
            const res = await fetch(`/api/audit-logs/export?category=${selectedCategory}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to export");
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit_logs_${selectedCategory}_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Export error:", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    icon={Activity}
                    title="Audit & Activity Logs"
                    description="Authoritative, tenant-scoped audit trails for security compliance, access governance, and workspace observability."
                />

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                        <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                        Refresh
                    </button>

                    <button
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2F8F83] rounded-lg hover:bg-[#25756B] transition-colors shadow-xs"
                    >
                        <Download size={14} />
                        {isExporting ? "Exporting..." : "Export CSV"}
                    </button>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => {
                        setSelectedCategory("all");
                        setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                        selectedCategory === "all"
                            ? "bg-[#2F8F83] text-white border-[#2F8F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                    <span>All Events</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 font-semibold"
                    }`}>
                        {categoriesData?.data?.total_events || categoriesData?.total_logs || 0}
                    </span>
                </button>

                {Object.entries(categoriesMap).map(([catKey, catInfo]: [string, any]) => {
                    const IconComponent = CATEGORY_ICONS[catKey] || Activity;
                    const isSelected = selectedCategory === catKey;
                    return (
                        <button
                            key={catKey}
                            onClick={() => {
                                setSelectedCategory(catKey);
                                setCurrentPage(1);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                                isSelected
                                    ? "bg-[#2F8F83] text-white border-[#2F8F83] shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <IconComponent size={13} className={isSelected ? "text-white" : "text-slate-400"} />
                            <span>{catInfo.label || catKey}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 font-semibold"
                            }`}>
                                {catInfo.count ?? 0}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search description, entity, action, or actor..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full h-9 pl-9 pr-4 bg-slate-50/70 border border-[#E5E9EE] rounded-lg text-xs font-medium text-[#172033] placeholder:text-[#8A95A3] focus:outline-none focus:ring-1 focus:ring-[#2F8F83] focus:border-[#2F8F83]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <SlidersHorizontal size={13} />
                        <span className="text-[10px] font-bold text-[#8A95A3] uppercase tracking-wider">Filters</span>
                    </div>

                    <select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 px-2.5 bg-slate-50/70 border border-[#E5E9EE] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2F8F83]"
                    >
                        <option value="all">All Actions</option>
                        <option value="contact.created">Contact Created</option>
                        <option value="contact.updated">Contact Updated</option>
                        <option value="contact.deleted">Contact Deleted</option>
                        <option value="campaign.launched">Campaign Launched</option>
                        <option value="campaign.paused">Campaign Paused</option>
                        <option value="campaign.cancelled">Campaign Cancelled</option>
                        <option value="waba.connected">WABA Connected</option>
                        <option value="waba.disconnected">WABA Disconnected</option>
                        <option value="template.created">Template Created</option>
                        <option value="conversation.assigned">Conversation Assigned</option>
                        <option value="billing.credit_purchased">Credit Purchased</option>
                        <option value="billing.plan_changed">Plan Changed</option>
                        <option value="permission.role_updated">Role Updated</option>
                    </select>

                    <select
                        value={dateRange}
                        onChange={(e) => {
                            setDateRange(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-9 px-2.5 bg-slate-50/70 border border-[#E5E9EE] rounded-lg text-xs font-medium text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2F8F83]"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-xl border border-slate-200">
                    <RefreshCw className="animate-spin text-[#2F8F83] h-7 w-7" />
                    <p className="text-xs text-slate-500 font-medium">Loading tenant audit history...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5E9EE] rounded-xl flex flex-col items-center gap-3 shadow-2xs">
                    <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[#172033]">No Audit Records Found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            No log events match your current filter criteria or workspace timeline.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-xl border border-[#E5E9EE] bg-white overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Action</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Actor</th>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3 text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => {
                                        const CategoryIcon = CATEGORY_ICONS[log.category] || Activity;
                                        const colorClass = CATEGORY_COLORS[log.category] || "text-slate-600 bg-slate-50 border-slate-200";

                                        return (
                                            <tr
                                                key={log.id}
                                                onClick={() => setActiveInspectionLog(log)}
                                                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border ${colorClass}`}>
                                                        <CategoryIcon size={12} />
                                                        <span className="capitalize">{log.category}</span>
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {log.action}
                                                    </code>
                                                </td>

                                                <td className="px-4 py-3.5 max-w-md">
                                                    <div className="font-medium text-slate-900 line-clamp-1">
                                                        {log.description}
                                                    </div>
                                                    {log.entity_name && (
                                                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                                            Target: {log.entity_name} {log.entity_id ? `(#${log.entity_id})` : ""}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {log.user_name || log.user_email ? (
                                                        <div>
                                                            <div className="font-medium text-slate-800">{log.user_name || "User"}</div>
                                                            <div className="text-[10px] text-slate-400">{log.user_email || ""}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">System Automation</span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                                                    {new Date(log.created_at).toLocaleString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                                    <span className="text-[11px] font-medium text-[#2F8F83] group-hover:underline">
                                                        View Diff →
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Showing {logs.length} of {pagination.total} records</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <span>Rows per page:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="h-7 px-1.5 border border-slate-200 rounded text-xs bg-white focus:outline-none"
                                >
                                    {[15, 30, 50, 100].map((num) => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage <= 1}
                                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronLeft size={14} className="inline mr-1" />
                                Previous
                            </button>
                            <span className="text-xs font-semibold px-2 text-slate-700">
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.last_page))}
                                disabled={currentPage >= pagination.last_page}
                                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                            >
                                Next
                                <ChevronRight size={14} className="inline ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Detail / Diff Modal */}
            {activeInspectionLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${CATEGORY_COLORS[activeInspectionLog.category] || "bg-slate-100"}`}>
                                    {activeInspectionLog.category}
                                </span>
                                <h3 className="text-sm font-semibold text-slate-900 font-mono">
                                    {activeInspectionLog.action}
                                </h3>
                            </div>
                            <button
                                onClick={() => setActiveInspectionLog(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 text-xs">
                            {/* Summary Banner */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium">
                                {activeInspectionLog.description}
                            </div>

                            {/* Key Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Actor</div>
                                    <div className="font-medium text-slate-800 mt-0.5">{activeInspectionLog.user_name || "System"}</div>
                                    <div className="text-[10px] text-slate-500">{activeInspectionLog.user_email || "Automated trigger"}</div>
                                </div>
                                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Entity</div>
                                    <div className="font-medium text-slate-800 mt-0.5">{activeInspectionLog.entity_type || "N/A"}</div>
                                    <div className="text-[10px] text-slate-500">ID: {activeInspectionLog.entity_id || "N/A"}</div>
                                </div>
                                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                    <div className="text-[10px] text-slate-400 uppercase font-semibold">IP & Client</div>
                                    <div className="font-medium text-slate-800 mt-0.5">{activeInspectionLog.ip_address || "127.0.0.1"}</div>
                                    <div className="text-[10px] text-slate-500 truncate" title={activeInspectionLog.user_agent || ""}>
                                        {activeInspectionLog.user_agent ? "Browser agent logged" : "Backend service"}
                                    </div>
                                </div>
                            </div>

                            {/* Value Diff (Old vs New) */}
                            {(activeInspectionLog.old_values || activeInspectionLog.new_values) && (
                                <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal size={13} />
                                        <span>Change Snapshot Diff</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-3">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1.5 flex items-center justify-between">
                                                <span>Previous Values (Before)</span>
                                                <span className="text-[9px] bg-rose-100 px-1.5 py-0.2 rounded font-mono">old</span>
                                            </div>
                                            <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                                                {activeInspectionLog.old_values
                                                    ? JSON.stringify(activeInspectionLog.old_values, null, 2)
                                                    : "<none / newly created>"}
                                            </pre>
                                        </div>

                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center justify-between">
                                                <span>New Values (After)</span>
                                                <span className="text-[9px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">new</span>
                                            </div>
                                            <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-48">
                                                {activeInspectionLog.new_values
                                                    ? JSON.stringify(activeInspectionLog.new_values, null, 2)
                                                    : "<deleted / removed>"}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Metadata */}
                            {activeInspectionLog.metadata && Object.keys(activeInspectionLog.metadata).length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Operation Metadata
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <pre className="text-[11px] font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-36">
                                            {JSON.stringify(activeInspectionLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Audit ID: #{activeInspectionLog.id} (Workspace #{activeInspectionLog.tenant_id})</span>
                                <span>{new Date(activeInspectionLog.created_at).toISOString()}</span>
                            </div>
                        </div>

                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                            <button
                                onClick={() => setActiveInspectionLog(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
