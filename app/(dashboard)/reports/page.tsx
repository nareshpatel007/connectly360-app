"use client";

import React from "react";
import Link from "next/link";
import {
    BarChart3,
    FileText,
    Receipt,
    Activity,
    Download,
    ArrowRight,
    TrendingUp,
    ShieldCheck,
    Coins
} from "lucide-react";

export default function ReportsOverviewPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <BarChart3 className="h-6 w-6 text-[#35877D]" />
                    Reports & Data Exports
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Export granular reporting logs, credit transaction ledgers, activity logs, and workspace audit summaries.
                </p>
            </div>

            {/* Reports Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Usage Reports */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold">
                            <BarChart3 size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Usage Reports</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Comprehensive breakdown of message delivery, AI tokens, and monthly credit usage logs.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/usage-reports"
                        className="w-full py-2.5 px-4 bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Usage Reports <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Credit History */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Coins size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Credit History & Ledger</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Audit ledger for credit purchases, campaign deductions, AI responses, and auto-recharge logs.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/credit-history"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Credit Ledger <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Activity Logs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Activity size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Activity Logs</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Audit trail of workspace logins, member role updates, campaign creations, and settings changes.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/activity-logs"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Activity Logs <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
