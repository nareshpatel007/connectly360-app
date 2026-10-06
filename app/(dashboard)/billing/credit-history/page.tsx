"use client";

import { useEffect, useState } from "react";
import {
    History, ArrowUpRight, ArrowDownLeft, Search,
    RefreshCw, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";

interface CreditTransaction {
    id: number;
    action_type: string;
    description: string;
    credits_amount: number;
    balance_before: number;
    balance_after: number;
    created_at: string;
}

export default function CreditHistoryPage() {
    const { token } = useAuth();
    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchHistory = async (page = 1, type = filterType) => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: String(page),
                type: type,
                per_page: "15"
            });
            const res = await fetch(`/api/billing/credit-history?${queryParams.toString()}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const result = await res.json();
            if (result.status && result.data) {
                setTransactions(result.data.data || []);
                setCurrentPage(result.data.current_page || 1);
                setLastPage(result.data.last_page || 1);
                setTotal(result.data.total || 0);
            }
        } catch (err) {
            console.error("Failed to load credit history", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchHistory(1, filterType);
        }
    }, [token, filterType]);

    const handleFilterChange = (type: "all" | "credit" | "debit") => {
        setFilterType(type);
        setCurrentPage(1);
    };

    const filtered = transactions.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.description?.toLowerCase().includes(q) ||
            t.action_type?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                icon={History}
                title="Credit History"
                description="Full audit trail of credit purchases, welcome bonuses, and action-by-action usage."
                actions={
                    <Button
                        variant="outline"
                        onClick={() => fetchHistory(currentPage, filterType)}
                        className="h-9 text-xs font-semibold rounded-xl border-slate-200 cursor-pointer"
                    >
                        <RefreshCw size={13} className={`mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                }
            />

            {/* Filter Toolbar */}
            <Card className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        size="sm"
                        variant={filterType === "all" ? "default" : "outline"}
                        onClick={() => handleFilterChange("all")}
                        className={`text-xs font-bold rounded-xl h-8 px-3 cursor-pointer ${filterType === "all" ? "bg-[#378179] text-white border-0" : ""}`}
                    >
                        All Transactions
                    </Button>
                    <Button
                        size="sm"
                        variant={filterType === "credit" ? "default" : "outline"}
                        onClick={() => handleFilterChange("credit")}
                        className={`text-xs font-bold rounded-xl h-8 px-3 cursor-pointer ${filterType === "credit" ? "bg-emerald-600 text-white border-0" : ""}`}
                    >
                        Credits Added (+)
                    </Button>
                    <Button
                        size="sm"
                        variant={filterType === "debit" ? "default" : "outline"}
                        onClick={() => handleFilterChange("debit")}
                        className={`text-xs font-bold rounded-xl h-8 px-3 cursor-pointer ${filterType === "debit" ? "bg-amber-600 text-white border-0" : ""}`}
                    >
                        Credits Used (-)
                    </Button>
                </div>

                <div className="w-full sm:w-64 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="Search description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                    />
                </div>
            </Card>

            {/* Transactions Table */}
            <Card className="rounded-2xl bg-white border border-[#EAE6DF] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-3.5">Date &amp; Time</th>
                                <th className="px-6 py-3.5">Action / Type</th>
                                <th className="px-6 py-3.5">Description</th>
                                <th className="px-6 py-3.5 text-right">Amount</th>
                                <th className="px-6 py-3.5 text-right">Balance After</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Loading transactions...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No credit transactions found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((tx) => {
                                    const isAddition = tx.credits_amount > 0;
                                    return (
                                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                                            <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                                                {new Date(tx.created_at).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isAddition
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                        : "bg-slate-50 text-slate-600 border border-slate-200"
                                                    }`}>
                                                    {isAddition ? (
                                                        <ArrowDownLeft size={12} className="text-emerald-600" />
                                                    ) : (
                                                        <ArrowUpRight size={12} className="text-amber-600" />
                                                    )}
                                                    {tx.action_type?.replace(/_/g, " ").toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 font-medium text-slate-800">
                                                {tx.description}
                                            </td>
                                            <td className="px-6 py-3.5 text-right whitespace-nowrap font-extrabold">
                                                <span className={isAddition ? "text-emerald-600" : "text-slate-800"}>
                                                    {isAddition ? `+${tx.credits_amount.toLocaleString()}` : tx.credits_amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right whitespace-nowrap font-bold text-slate-600">
                                                {tx.balance_after?.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {lastPage > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Showing Page {currentPage} of {lastPage} ({total} transactions)</span>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage <= 1 || isLoading}
                                onClick={() => fetchHistory(currentPage - 1)}
                                className="h-8 text-xs rounded-xl cursor-pointer"
                            >
                                <ChevronLeft size={14} className="mr-1" />
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={currentPage >= lastPage || isLoading}
                                onClick={() => fetchHistory(currentPage + 1)}
                                className="h-8 text-xs rounded-xl cursor-pointer"
                            >
                                Next
                                <ChevronRight size={14} className="ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
