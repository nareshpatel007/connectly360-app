"use client";

import { useEffect, useState } from "react";
import { Receipt, Loader2, Landmark, Coins, TrendingDown, TrendingUp, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";

interface CreditLog {
    id: number;
    action: string;
    description: string;
    credits: number | null;
    created_at: string;
}

export default function CreditHistoryPage() {
    const { token } = useAuth();
    const [history, setHistory] = useState<CreditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState({ available: 0, used: 0, total: 0 });

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all"); // all, in, out
    const [dateFilter, setDateFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
                    setHistory(result.data || []);
                    if (result.summary) {
                        setSummary(result.summary);
                    }
                }
            } catch (err) {
                console.error("Failed to load credit history", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchHistory();
        }
    }, [token]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, dateFilter]);

    // Filtering logic
    const filteredHistory = history.filter((log) => {
        // 1. Search filter
        const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Type filter
        const isAddition = log.action === "credit_purchase" || log.action === "select_plan" || log.action === "subscription_purchase" || (log.credits !== null && log.credits > 0);
        let matchesType = true;
        if (typeFilter === "in") {
            matchesType = isAddition;
        } else if (typeFilter === "out") {
            matchesType = !isAddition;
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

        return matchesSearch && matchesType && matchesDate;
    });

    // Pagination calculations
    const totalEntries = filteredHistory.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={Receipt}
                title="Credit History"
                description="Track all credit increments (purchases, subscription setup) and decrements (message logs)."
            />

            {/* Summary Indicators */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Available Balance</span>
                    <div className="text-2xl font-black text-[#35877D] mt-1">{summary.available.toLocaleString()} <span className="text-xs font-semibold text-gray-400">Credits</span></div>
                </div>
                <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Consumed</span>
                    <div className="text-2xl font-black text-amber-600 mt-1">{summary.used.toLocaleString()} <span className="text-xs font-semibold text-gray-400">Credits</span></div>
                </div>
                <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Acquired</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{summary.total.toLocaleString()} <span className="text-xs font-semibold text-gray-400">Credits</span></div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white border border-[#EAE6DF] shadow-xs rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search logs description or action..."
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

                    {/* Type Filter */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#35877D]"
                    >
                        <option value="all">All Transactions</option>
                        <option value="in">Credit In (Additions)</option>
                        <option value="out">Credit Out (Deductions)</option>
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
                    <p className="text-xs text-slate-400 font-semibold font-sans">Loading ledger entries...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-3 shadow-xs">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <Receipt size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-800">No transactions match</h3>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs leading-normal">
                            Try adjusting your filters or search keywords.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-150 bg-slate-50/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            <span className="col-span-2">Flow</span>
                            <span className="col-span-3">Action</span>
                            <span className="col-span-4">Description</span>
                            <span className="col-span-2">Date & Time</span>
                            <span className="col-span-1 text-right">Value</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {currentItems.map((log) => {
                                const isAddition = log.action === "credit_purchase" || log.action === "select_plan" || log.action === "subscription_purchase" || (log.credits !== null && log.credits > 0);

                                return (
                                    <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                                        <div className="col-span-2 flex items-center gap-1">
                                            {isAddition ? (
                                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                    <TrendingUp size={11} />
                                                    Credit In
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                    <TrendingDown size={11} />
                                                    Credit Out
                                                </span>
                                            )}
                                        </div>
                                        <div className="col-span-3 text-xs font-semibold text-slate-800 uppercase tracking-wide">
                                            {log.action.replace("_", " ")}
                                        </div>
                                        <div className="col-span-4 text-xs text-slate-700 font-semibold leading-relaxed">
                                            {log.description}
                                        </div>
                                        <div className="col-span-2 text-[11px] text-slate-400 font-semibold">
                                            {new Date(log.created_at).toLocaleString("en-IN")}
                                        </div>
                                        <div className={`col-span-1 text-right text-xs font-extrabold ${isAddition ? "text-emerald-600" : "text-amber-600"}`}>
                                            {isAddition ? "+" : "-"}{Math.abs(log.credits || 0)}
                                        </div>
                                    </div>
                                );
                            })}
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
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} entries
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
