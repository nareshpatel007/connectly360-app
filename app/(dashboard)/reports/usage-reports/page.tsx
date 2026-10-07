"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2, Calendar, Search, SlidersHorizontal, ArrowUpDown, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";

interface CreditLog {
    id: number;
    action: string;
    description: string;
    credits: number | null;
    created_at: string;
}

export default function UsageReportsPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState<CreditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Fetch ledger
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/reports/credit-history", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await res.json();
                if (result.status) {
                    // Filter down to only consumption (credit_usage / negative credits)
                    const consumptionLogs = (result.data || []).filter(
                        (log: CreditLog) => log.action === "credit_usage" || (log.credits !== null && log.credits < 0)
                    );
                    setHistory(consumptionLogs);
                }
            } catch (err) {
                console.error("Failed to load usage history", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchHistory();
        }
    }, [token]);

    // Handle resetting page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, dateFilter]);

    // Helper: Categorize consumption based on description
    const getConsumptionCategory = (desc: string) => {
        const d = desc.toLowerCase();
        if (d.includes("ai auto-reply") || d.includes("ai reply")) return { label: "AI Reply", color: "bg-purple-50 text-purple-700 border-purple-100" };
        if (d.includes("knowledge base")) return { label: "KB Search", color: "bg-indigo-50 text-indigo-700 border-indigo-100" };
        if (d.includes("media message")) return { label: "Media Msg", color: "bg-sky-50 text-sky-700 border-sky-100" };
        if (d.includes("campaign message")) return { label: "Campaign", color: "bg-teal-50 text-teal-700 border-teal-100" };
        if (d.includes("lead created") || d.includes("lead creation")) return { label: "Lead Creation", color: "bg-amber-50 text-amber-700 border-amber-100" };
        if (d.includes("workflow")) return { label: "Workflow", color: "bg-rose-50 text-rose-700 border-rose-100" };
        return { label: "Outbound Msg", color: "bg-slate-50 text-slate-700 border-slate-100" };
    };

    // Filter Logic
    const filteredHistory = history.filter((log) => {
        // 1. Search Query Filter
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Type/Category Filter
        let matchesType = true;
        if (typeFilter !== "all") {
            const cat = getConsumptionCategory(log.description).label.toLowerCase();
            matchesType = cat === typeFilter.toLowerCase();
        }

        // 3. Date Range Filter
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

        return matchesSearch && matchesType && matchesDate;
    });

    // Pagination calculations
    const totalEntries = filteredHistory.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

    // Summary calculations
    const totalCreditsConsumed = Math.abs(history.reduce((acc, log) => acc + (log.credits || 0), 0));
    const aiRepliesCount = history.filter(l => l.description.toLowerCase().includes("ai reply") || l.description.toLowerCase().includes("ai auto-reply")).length;
    const kbQueriesCount = history.filter(l => l.description.toLowerCase().includes("knowledge base")).length;
    const campaignCount = history.filter(l => l.description.toLowerCase().includes("campaign")).length;

    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={BarChart3}
                title="Usage Reports"
                description="Audit credit consumption breakdown across WhatsApp channels, campaigns, and AI agents."
            />

            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-5">
                    <span className="text-[10px] font-semibold text-[#8A95A3] uppercase tracking-wider">Total Consumed</span>
                    <div className="text-2xl font-bold text-[#172033] mt-1">{totalCreditsConsumed.toLocaleString()} <span className="text-xs font-medium text-[#8A95A3]">Credits</span></div>
                </div>
                <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-5">
                    <span className="text-[10px] font-semibold text-[#8A95A3] uppercase tracking-wider">AI Auto-replies</span>
                    <div className="text-2xl font-bold text-[#2F8F83] mt-1">{aiRepliesCount.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-5">
                    <span className="text-[10px] font-semibold text-[#8A95A3] uppercase tracking-wider">KB Queries Search</span>
                    <div className="text-2xl font-bold text-indigo-600 mt-1">{kbQueriesCount.toLocaleString()}</div>
                </div>
                <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-5">
                    <span className="text-[10px] font-semibold text-[#8A95A3] uppercase tracking-wider">Campaign Sends</span>
                    <div className="text-2xl font-bold text-[#2F8F83] mt-1">{campaignCount.toLocaleString()}</div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search logs description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-slate-50/70 border border-[#E5E9EE] rounded-xl text-xs font-medium text-[#172033] placeholder:text-[#8A95A3] focus:outline-none focus:ring-1 focus:ring-[#2F8F83] focus:border-[#2F8F83]"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-[#8A95A3] uppercase">Filters</span>
                    </div>

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50/70 border border-[#E5E9EE] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2F8F83]"
                    >
                        <option value="all">All Consumption Types</option>
                        <option value="AI Reply">AI Reply</option>
                        <option value="KB Search">KB Search</option>
                        <option value="Media Msg">Media Message</option>
                        <option value="Campaign">Campaign Message</option>
                        <option value="Lead Creation">Lead Creation</option>
                        <option value="Workflow">Workflow Execution</option>
                        <option value="Outbound Msg">Outbound Message</option>
                    </select>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50/70 border border-[#E5E9EE] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#2F8F83]"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                    </select>
                </div>
            </div>

            {/* Table & Pagination Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#2F8F83] h-8 w-8" />
                    <p className="text-xs text-[#5F6B7A] font-medium font-sans">Loading usage metrics...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5E9EE] rounded-xl flex flex-col items-center gap-3 shadow-2xs">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <BarChart3 size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-[#172033]">No usage logs found</h3>
                        <p className="text-xs text-[#5F6B7A] mt-0.5 max-w-xs leading-normal">
                            Try adjusting your filters or keyword search.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-xl border border-[#E5E9EE] bg-white overflow-hidden shadow-2xs">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#E5E9EE] bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-[#5F6B7A]">
                            <span className="col-span-2">Type</span>
                            <span className="col-span-7">Log Description</span>
                            <span className="col-span-2">Date & Time</span>
                            <span className="col-span-1 text-right">Cost</span>
                        </div>
                        <div className="divide-y divide-[#E5E9EE]">
                            {currentItems.map((log) => {
                                const category = getConsumptionCategory(log.description);
                                return (
                                    <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                        <div className="col-span-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase border tracking-wider ${category.color}`}>
                                                {category.label}
                                            </span>
                                        </div>
                                        <div className="col-span-7 text-xs text-[#172033] font-medium leading-relaxed">
                                            {log.description}
                                        </div>
                                        <div className="col-span-2 text-[11px] text-[#5F6B7A] font-medium">
                                            {new Date(log.created_at).toLocaleString("en-IN")}
                                        </div>
                                        <div className="col-span-1 text-right text-xs font-semibold text-amber-600">
                                            -{Math.abs(log.credits || 0)} Credits
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xs text-[#5F6B7A] font-medium">Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="h-8 px-2 bg-white border border-[#E5E9EE] rounded-lg text-xs font-medium text-[#172033] focus:outline-none"
                            >
                                {[5, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span className="text-xs text-[#5F6B7A] font-medium">entries</span>
                            <span className="text-xs text-[#8A95A3] font-normal ml-4">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} logs
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8 px-3 rounded-lg border border-[#E5E9EE] bg-white text-xs font-medium text-[#5F6B7A] disabled:opacity-40 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition-all ${currentPage === page
                                            ? "bg-[#2F8F83] text-white shadow-2xs"
                                            : "border border-[#E5E9EE] bg-white text-[#5F6B7A] hover:bg-slate-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3 rounded-lg border border-[#E5E9EE] bg-white text-xs font-medium text-[#5F6B7A] disabled:opacity-40 hover:bg-slate-50 transition-colors"
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
