"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";

interface LogItem {
    id: number;
    action: string;
    description: string;
    ip_address: string | null;
    created_at: string;
}

export default function ActivityLogsPage() {
    const { token } = useAuth();
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/reports/activity-logs", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await res.json();
                if (result.status) {
                    setLogs(result.data || []);
                }
            } catch (err) {
                console.error("Failed to load activity logs", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchLogs();
        }
    }, [token]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, actionFilter, dateFilter]);

    // Filter logic
    const filteredLogs = logs.filter((log) => {
        // 1. Search filter
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Action filter
        let matchesAction = true;
        if (actionFilter !== "all") {
            matchesAction = log.action.toLowerCase() === actionFilter.toLowerCase();
        }

        // 3. Date filter
        let matchesDate = true;
        if (dateFilter !== "all") {
            const logDate = new Date(log.created_at);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (dateFilter === "today") {
                matchesDate = logDate >= today;
            } else if (dateFilter === "yesterday") {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                matchesDate = logDate >= yesterday && logDate < today;
            } else if (dateFilter === "7days") {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                matchesDate = logDate >= sevenDaysAgo;
            } else if (dateFilter === "30days") {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                matchesDate = logDate >= thirtyDaysAgo;
            }
        }

        return matchesSearch && matchesAction && matchesDate;
    });

    // Pagination calculations
    const totalEntries = filteredLogs.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Activity}
                title="Activity Logs"
                description="Audit log tracking all login, purchase, and workspace configuration changes."
            />

            {/* Filters Bar */}
            <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search event details or actions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#35877D] focus:border-[#35877D]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Filters</span>
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                    >
                        <option value="all">All Actions</option>
                        <option value="login">Login Events</option>
                        <option value="credit_purchase">Credit Purchase</option>
                        <option value="credit_usage">Credit Usage</option>
                        <option value="select_plan">Select Plan</option>
                        <option value="subscription_purchase">Subscription Payment</option>
                    </select>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Table Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#378179] h-8 w-8" />
                    <p className="text-xs text-slate-400 font-semibold font-sans">Loading audit history...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-3 shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-800">No logs match</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs leading-normal">
                            Try adjusting your filters or search keywords.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-150 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            <span className="col-span-3">Action</span>
                            <span className="col-span-6">Description</span>
                            <span className="col-span-3">Date &amp; Time</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {currentItems.map((log) => (
                                <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                                    <div className="col-span-3">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${log.action === "login"
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : log.action === "subscription_purchase" || log.action === "credit_purchase"
                                                    ? "bg-purple-50 text-purple-700 border border-purple-100"
                                                    : "bg-blue-50 text-blue-700 border border-blue-100"
                                            }`}>
                                            {log.action.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="col-span-6 text-xs text-slate-700 font-semibold leading-relaxed">
                                        {log.description}
                                        {log.ip_address && (
                                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5 font-normal">IP Address: {log.ip_address}</span>
                                        )}
                                    </div>
                                    <div className="col-span-3 text-[11px] text-slate-400 font-semibold">
                                        {new Date(log.created_at).toLocaleString("en-IN")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs text-slate-500 font-semibold">Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                            >
                                {[5, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span className="text-xs text-slate-500 font-semibold">entries</span>
                            <span className="text-xs text-slate-400 font-medium ml-4">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} logs
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                            ? "bg-[#35877D] text-white shadow-xs"
                                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
