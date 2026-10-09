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
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ReportsOverviewPage() {
    return (
        <div className="space-y-6 w-full">
            <PageHeader
                icon={BarChart3}
                title="Reports & Data Exports"
                description="Export granular reporting logs, credit transaction ledgers, activity logs, and workspace audit summaries."
                breadcrumbs={[{ label: "Reports" }]}
            />

            {/* Reports Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Usage Reports */}
                <Card className="bg-white border border-[#E5E9EE] rounded-xl p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center font-bold">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">Usage Reports</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Comprehensive breakdown of message delivery, AI tokens, and monthly credit usage logs.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/usage-reports"
                        className="w-full py-2.5 px-4 bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Usage Reports <ArrowRight size={14} />
                    </Link>
                </Card>

                {/* Credit History */}
                <Card className="bg-white border border-[#E5E9EE] rounded-xl p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Coins size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">Credit History & Ledger</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Audit ledger for credit purchases, campaign deductions, AI responses, and auto-recharge logs.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/credit-history"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Credit Ledger <ArrowRight size={14} />
                    </Link>
                </Card>

                {/* Activity Logs */}
                <Card className="bg-white border border-[#E5E9EE] rounded-xl p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">Activity Logs</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Audit trail of workspace logins, member role updates, campaign creations, and settings changes.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/activity-logs"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        View Activity Logs <ArrowRight size={14} />
                    </Link>
                </Card>

                {/* Data Exports & Privacy */}
                <Card className="bg-white border border-[#E5E9EE] rounded-xl p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Download size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">Data Exports & Privacy</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                GDPR/CCPA compliant exports for contacts, campaigns, transcripts, and transaction ledgers.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/reports/data-exports"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        Manage Exports <ArrowRight size={14} />
                    </Link>
                </Card>
            </div>
        </div>
    );
}
