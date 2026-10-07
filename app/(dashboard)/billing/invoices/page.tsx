"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2, CreditCard, Award, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";

interface InvoiceItem {
    id: number;
    payment_id: string | null;
    order_id: string | null;
    amount: string;
    currency: string;
    type: string;
    plan: string | null;
    credits: number | null;
    status: string;
    created_at: string;
}

export default function InvoicesPage() {
    const { token } = useAuth();
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await fetch("/api/reports/invoices", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const result = await res.json();
                if (result.status) {
                    setInvoices(result.data || []);
                }
            } catch (err) {
                console.error("Failed to load invoices", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchInvoices();
        }
    }, [token]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, dateFilter]);

    // Filter logic
    const filteredInvoices = invoices.filter((inv) => {
        // 1. Search Query
        const invoiceNum = `INV-${String(inv.id).padStart(4, "0")}`;
        const planName = inv.plan || "";
        const creditsText = inv.credits ? `${inv.credits} credits` : "";
        const matchesSearch = invoiceNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.payment_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            creditsText.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Type Filter
        let matchesType = true;
        if (typeFilter !== "all") {
            matchesType = inv.type.toLowerCase() === typeFilter.toLowerCase();
        }

        // 3. Date Filter
        let matchesDate = true;
        if (dateFilter !== "all") {
            const logDate = new Date(inv.created_at);
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
    const totalEntries = filteredInvoices.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={FileText}
                title="Billing Invoices"
                description="Track your subscription payments, recharges, and billing history."
            />

            {/* Filters Bar */}
            <div className="bg-white border border-[#E5E9EE] shadow-2xs rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Invoice ID, Payment ID, Plan or Credits..."
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
                        <option value="all">All Invoices</option>
                        <option value="subscription">Subscriptions</option>
                        <option value="credits">Credit Recharges</option>
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

            {/* Table Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="animate-spin text-[#2F8F83] h-8 w-8" />
                    <p className="text-xs text-[#5F6B7A] font-medium font-sans">Loading invoices...</p>
                </div>
            ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E5E9EE] rounded-xl flex flex-col items-center gap-3 shadow-2xs">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-[#172033]">No invoices match</h3>
                        <p className="text-xs text-[#5F6B7A] mt-0.5 max-w-xs leading-normal">
                            Try adjusting your filters or search terms.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-xl border border-[#E5E9EE] bg-white overflow-hidden shadow-2xs">
                        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-[#E5E9EE] bg-slate-50/70 text-[10px] font-semibold uppercase tracking-wider text-[#5F6B7A]">
                            <span className="col-span-2">Invoice ID</span>
                            <span className="col-span-4">Description</span>
                            <span className="col-span-2">Payment ID</span>
                            <span className="col-span-2">Amount</span>
                            <span className="col-span-2">Date</span>
                        </div>
                        <div className="divide-y divide-[#E5E9EE]">
                            {currentItems.map((inv) => (
                                <div key={inv.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                    <div className="col-span-2 text-xs font-semibold text-[#172033]">
                                        INV-{String(inv.id).padStart(4, "0")}
                                    </div>
                                    <div className="col-span-4 flex items-center gap-2">
                                        {inv.type === "subscription" ? (
                                            <div className="flex items-center gap-1.5 text-xs text-[#172033] font-medium">
                                                <Award size={14} className="text-[#2F8F83]" />
                                                <span>Upgrade: <span className="uppercase text-[#2F8F83] font-semibold">{inv.plan}</span></span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-[#172033] font-medium">
                                                <CreditCard size={14} className="text-[#2F8F83]" />
                                                <span>Top-up: <span className="text-[#2F8F83] font-semibold">{inv.credits?.toLocaleString()} Credits</span></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 text-[11px] font-mono text-[#5F6B7A] font-medium truncate select-all" title={inv.payment_id || ""}>
                                        {inv.payment_id || "N/A"}
                                    </div>
                                    <div className="col-span-2 text-xs font-semibold text-[#172033]">
                                        ₹{Number(inv.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="col-span-2 text-[11px] text-[#5F6B7A] font-medium">
                                        {new Date(inv.created_at).toLocaleDateString("en-IN")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pagination Controls */}
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
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} invoices
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
