"use client";

import React, { useState } from "react";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ShieldCheck,
    Users,
    DollarSign,
    Layers,
    Phone,
    Radio,
    Key,
    Webhook,
    FileCheck2,
    Check,
    ChevronDown,
    ChevronUp,
    Info,
    AlertOctagon,
    Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CampaignPreflightResult, PreflightCheckItem } from "@/lib/api-client-react";

interface CampaignPreflightWidgetProps {
    preflight: CampaignPreflightResult;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    className?: string;
}

export function CampaignPreflightWidget({
    preflight,
    onRefresh,
    isRefreshing = false,
    className = "",
}: CampaignPreflightWidgetProps) {
    const [showSampleExcluded, setShowSampleExcluded] = useState(false);
    const [showSampleEligible, setShowSampleEligible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "failed" | "warning">("all");

    const {
        is_launchable,
        summary,
        reasons,
        sample_eligible = [],
        sample_excluded = [],
        checks = [],
        critical_failures = [],
    } = preflight;

    const filteredChecks = checks.filter((c) => {
        if (activeFilter === "all") return true;
        return c.status === activeFilter;
    });

    const passedCount = checks.filter((c) => c.status === "passed").length;
    const failedCount = checks.filter((c) => c.status === "failed").length;
    const warningCount = checks.filter((c) => c.status === "warning").length;

    const getCheckIcon = (check: PreflightCheckItem) => {
        if (check.status === "passed") {
            return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
        }
        if (check.status === "failed") {
            return <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />;
        }
        return <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0" />;
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 1. Overall Preflight Readiness Banner */}
            <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    is_launchable
                        ? "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "bg-rose-50/80 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800"
                }`}
            >
                <div className="flex items-start gap-3">
                    <div
                        className={`p-2 rounded-lg mt-0.5 ${
                            is_launchable
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                    >
                        {is_launchable ? <ShieldCheck className="h-6 w-6" /> : <AlertOctagon className="h-6 w-6" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">
                                {is_launchable
                                    ? "Preflight Approved — Ready for Broadcast"
                                    : "Launch Blocked — Critical Preflight Issues"}
                            </h3>
                            <Badge
                                variant={is_launchable ? "default" : "destructive"}
                                className={`text-[10px] font-semibold uppercase ${
                                    is_launchable ? "bg-emerald-600 hover:bg-emerald-700" : ""
                                }`}
                            >
                                {is_launchable ? "Launch Eligible" : "Action Required"}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {is_launchable
                                ? "All 12 preflight verification checks passed. Audience and WhatsApp channel are fully configured."
                                : `${failedCount} critical check(s) must be resolved before Meta broadcast dispatch can proceed.`}
                        </p>
                    </div>
                </div>

                {onRefresh && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="text-xs h-8 shrink-0 bg-white dark:bg-zinc-900"
                    >
                        {isRefreshing ? "Auditing..." : "Re-run Preflight"}
                    </Button>
                )}
            </div>

            {/* 2. Audience Eligibility Cards (Show: Eligible, Excluded, Reasons) */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#2F8F83]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Audience Preflight Breakdown
                        </h4>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                        Total Audience: <strong className="text-foreground">{summary.total.toLocaleString()}</strong>
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Eligible Stat */}
                    <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block">
                                Eligible Recipients
                            </span>
                            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {summary.eligible.toLocaleString()}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                            {summary.total > 0 ? Math.round((summary.eligible / summary.total) * 100) : 0}%
                        </span>
                    </div>

                    {/* Excluded Stat */}
                    <div className="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block">
                                Excluded Contacts
                            </span>
                            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                                {summary.excluded.toLocaleString()}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                            {summary.total > 0 ? Math.round((summary.excluded / summary.total) * 100) : 0}%
                        </span>
                    </div>

                    {/* Quality Opt-In Rate */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-semibold text-muted-foreground block">
                                WhatsApp Opt-In Rate
                            </span>
                            <span className="text-xl font-extrabold text-foreground">
                                {summary.total > 0
                                    ? Math.round(
                                          ((summary.total - (reasons.no_marketing_opt_in ?? 0)) / summary.total) * 100
                                      )
                                    : 100}
                                %
                            </span>
                        </div>
                        <Sparkles className="h-5 w-5 text-amber-500 opacity-80" />
                    </div>
                </div>

                {/* Exclusion Reasons Grid */}
                {summary.excluded > 0 && (
                    <div className="pt-2 border-t border-border/60 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-foreground">Exclusion Reasons Breakdown</span>
                            <button
                                type="button"
                                onClick={() => setShowSampleExcluded(!showSampleExcluded)}
                                className="text-[11px] text-[#2F8F83] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                            >
                                {showSampleExcluded ? (
                                    <>
                                        Hide samples <ChevronUp size={12} />
                                    </>
                                ) : (
                                    <>
                                        View excluded samples <ChevronDown size={12} />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">No WhatsApp Number:</span>
                                <span className="font-bold text-foreground">{reasons.no_phone ?? 0}</span>
                            </div>
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">Invalid Phone Format:</span>
                                <span className="font-bold text-foreground">{reasons.invalid_phone ?? 0}</span>
                            </div>
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">Duplicate Phone:</span>
                                <span className="font-bold text-foreground">{reasons.duplicate_phone ?? 0}</span>
                            </div>
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">Missing Opt-In:</span>
                                <span className="font-bold text-foreground">{reasons.no_marketing_opt_in ?? 0}</span>
                            </div>
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">Suppressed / Blocked:</span>
                                <span className="font-bold text-foreground">{reasons.blocked_or_suppressed ?? 0}</span>
                            </div>
                            <div className="p-2 bg-muted/20 rounded border border-border flex items-center justify-between">
                                <span className="text-muted-foreground text-[11px]">Missing Variables:</span>
                                <span className="font-bold text-foreground">{reasons.missing_variables ?? 0}</span>
                            </div>
                        </div>

                        {/* Sample Excluded Table */}
                        {showSampleExcluded && sample_excluded.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 space-y-1.5 mt-2">
                                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                                    Sample Excluded Contacts:
                                </span>
                                <div className="divide-y divide-rose-100 dark:divide-rose-900/50">
                                    {sample_excluded.map((item, idx) => (
                                        <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                                            <span className="font-medium text-foreground">
                                                {item.name || "Contact"} ({item.phone})
                                            </span>
                                            <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                                {item.reason}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. The 12-Point Preflight Checks Audit Matrix */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#2F8F83]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            12-Point Launch Verification Checklist
                        </h4>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveFilter("all")}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                                activeFilter === "all"
                                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-zinc-900"
                                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                            }`}
                        >
                            All ({checks.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter("passed")}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                                activeFilter === "passed"
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border-emerald-200"
                            }`}
                        >
                            Passed ({passedCount})
                        </button>
                        {failedCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveFilter("failed")}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                                    activeFilter === "failed"
                                        ? "bg-rose-600 text-white border-rose-600"
                                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 border-rose-200"
                                }`}
                            >
                                Failed ({failedCount})
                            </button>
                        )}
                        {warningCount > 0 && (
                            <button
                                type="button"
                                onClick={() => setActiveFilter("warning")}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                                    activeFilter === "warning"
                                        ? "bg-amber-600 text-white border-amber-600"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-200"
                                }`}
                            >
                                Warnings ({warningCount})
                            </button>
                        )}
                    </div>
                </div>

                {/* Audit Items List */}
                <div className="divide-y divide-border/60 rounded-lg border border-border overflow-hidden">
                    {filteredChecks.map((check) => {
                        return (
                            <div
                                key={check.key}
                                className={`p-3 flex items-start justify-between gap-3 transition-colors ${
                                    check.status === "failed"
                                        ? "bg-rose-50/40 dark:bg-rose-950/20"
                                        : check.status === "warning"
                                          ? "bg-amber-50/30 dark:bg-amber-950/15"
                                          : "hover:bg-muted/20"
                                }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5">{getCheckIcon(check)}</div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-foreground">
                                                {check.label}
                                            </span>
                                            {check.critical && check.status === "failed" && (
                                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded uppercase">
                                                    Blocking
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            {check.message}
                                        </p>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                            check.status === "passed"
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                : check.status === "failed"
                                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        }`}
                                    >
                                        {check.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Critical Failures Summary Alert (if launch is blocked) */}
            {critical_failures.length > 0 && (
                <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                        <AlertOctagon className="h-4 w-4 shrink-0" />
                        <h4 className="text-xs font-bold">Launch Blockers ({critical_failures.length})</h4>
                    </div>
                    <ul className="text-xs text-rose-700 dark:text-rose-400 space-y-1 pl-6 list-disc">
                        {critical_failures.map((msg, idx) => (
                            <li key={idx} className="leading-snug">
                                {msg}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
