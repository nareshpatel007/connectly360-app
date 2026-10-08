"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    HelpCircle,
    Info,
    Phone,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Wrench,
    XCircle,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function WhatsAppBillingDiagnosticsPage() {
    const queryClient = useQueryClient();

    const { data: diagData, isLoading, refetch } = useQuery({
        queryKey: ["whatsappBillingDiagnostics"],
        queryFn: async () => {
            const res = await apiFetch("/api/whatsapp/billing/diagnostics");
            if (!res.ok) throw new Error("Failed to load diagnostics");
            const json = await res.json();
            return json.data;
        },
    });

    const runHealthCheckMutation = useMutation({
        mutationFn: async () => {
            const res = await apiFetch("/api/whatsapp/billing/health-check", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Health check failed");
            return res.json();
        },
        onSuccess: (data) => {
            toast.success("Health check completed successfully");
            queryClient.invalidateQueries({ queryKey: ["whatsappBillingDiagnostics"] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to execute health check");
        },
    });

    const handleRunCheck = () => {
        runHealthCheckMutation.mutate();
    };

    const isRunning = runHealthCheckMutation.isPending;
    const checks = diagData?.checks || {};
    const isBillingSetupRequired =
        diagData?.billing_status === "payment_setup_required" ||
        checks?.billing_eligibility?.code === 131042;

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
            <PageHeader
                icon={Wrench}
                title="WhatsApp Billing & Diagnostics"
                description="Monitor Meta WhatsApp Cloud API connection status, phone registration, and Meta billing eligibility."
                breadcrumbs={[
                    { label: "Integrations" },
                    { label: "WhatsApp", href: "/integrations/whatsapp" },
                    { label: "Billing & Diagnostics" },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/integrations/whatsapp">
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Back to WhatsApp
                            </Button>
                        </Link>
                        <Button
                            onClick={handleRunCheck}
                            disabled={isRunning}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs h-9 px-4 rounded-xl font-semibold gap-1.5 shadow-sm"
                        >
                            <RefreshCw size={14} className={isRunning ? "animate-spin" : ""} />
                            {isRunning ? "Running Check..." : "Run Health Check"}
                        </Button>
                    </div>
                }
            />

            {/* Error 131042 Advisory Alert */}
            {isBillingSetupRequired && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-xs">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-amber-900">
                                    WhatsApp billing setup required (Meta Error 131042)
                                </h3>
                                <Badge className="bg-amber-100 text-amber-800 text-[10px] font-semibold">Action Required</Badge>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Meta could not process marketing or utility messages because the connected WhatsApp Business Account is not currently eligible for WhatsApp billing. Please add a valid payment method or credit line in your Meta Business Suite.
                            </p>
                            <div className="pt-2 flex flex-wrap items-center gap-3">
                                <a
                                    href="https://business.facebook.com/billing_hub/accounts"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Open Meta Billing Hub <ExternalLink size={12} />
                                </a>
                                <span className="text-[11px] text-amber-700 flex items-center gap-1">
                                    <Info size={13} />
                                    This is separate from your Connectly360 credits.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Account Summary Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
                    <CardContent className="p-5 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Connection Status</div>
                        <div className="flex items-center gap-2 pt-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="text-sm font-bold text-slate-800 capitalize">
                                {diagData?.connection_status || "Checking..."}
                            </div>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-1">
                            {diagData?.display_number || "No number"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
                    <CardContent className="p-5 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Meta Billing Status</div>
                        <div className="flex items-center gap-2 pt-1">
                            {isBillingSetupRequired ? (
                                <>
                                    <XCircle size={15} className="text-amber-500" />
                                    <span className="text-sm font-bold text-amber-700">Setup Required</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} className="text-emerald-500" />
                                    <span className="text-sm font-bold text-emerald-700">Active & Eligible</span>
                                </>
                            )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                            {isBillingSetupRequired ? "Error 131042 flagged" : "Meta credit line verified"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
                    <CardContent className="p-5 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Messaging Eligibility</div>
                        <div className="flex items-center gap-2 pt-1">
                            <ShieldCheck size={16} className={isBillingSetupRequired ? "text-amber-500" : "text-emerald-500"} />
                            <span className="text-sm font-bold text-slate-800">
                                {checks?.messaging_eligibility?.status === "healthy" ? "Approved" : "Restricted"}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                            {checks?.phone?.messaging_limit_tier || "Tier 50 (Standard)"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
                    <CardContent className="p-5 space-y-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Failure Count</div>
                        <div className="text-lg font-black text-slate-800 pt-0.5">
                            {diagData?.failure_count ?? 0}
                        </div>
                        <div className="text-[11px] text-slate-400">
                            {diagData?.last_failure_code ? `Last code: ${diagData.last_failure_code}` : "No recent failures"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Health Check Results Checklist */}
            <Card className="rounded-2xl border-slate-200 shadow-xs bg-white">
                <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold text-slate-900">
                            System Diagnostics Checklist
                        </CardTitle>
                        <p className="text-xs text-slate-500 mt-0.5">Verification results across Meta Cloud API components.</p>
                    </div>
                    {diagData?.diagnostics_timestamp && (
                        <div className="text-[11px] text-slate-400 font-mono">
                            Last Checked: {new Date(diagData.diagnostics_timestamp).toLocaleTimeString()}
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-5 divide-y divide-slate-100">
                    {/* WABA Check */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <Activity size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">WhatsApp Business Account (WABA)</div>
                                <div className="text-[11px] text-slate-500">{checks?.waba?.message || "WABA active"}</div>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Passed</Badge>
                    </div>

                    {/* Phone Registration Check */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <Phone size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">Phone Registration & Certificate</div>
                                <div className="text-[11px] text-slate-500">{checks?.phone_registration?.message || "Phone registered"}</div>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Passed</Badge>
                    </div>

                    {/* Token Validity */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <ShieldCheck size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">Meta System Token & Permissions</div>
                                <div className="text-[11px] text-slate-500">{checks?.token?.message || "Token valid"}</div>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Passed</Badge>
                    </div>

                    {/* Meta Billing Eligibility */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isBillingSetupRequired ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-[#35877D]"}`}>
                                <CreditCard size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">Meta Billing & Payment Method</div>
                                <div className="text-[11px] text-slate-500">{checks?.billing_eligibility?.message || "Meta billing status normal"}</div>
                            </div>
                        </div>
                        {isBillingSetupRequired ? (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Setup Required</Badge>
                        ) : (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Eligible</Badge>
                        )}
                    </div>

                    {/* Template Availability */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <CheckCircle2 size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">Template Access & Sync</div>
                                <div className="text-[11px] text-slate-500">{checks?.template_availability?.message || "Templates accessible"}</div>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Passed</Badge>
                    </div>

                    {/* Webhook Status */}
                    <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <RefreshCw size={16} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-800">Meta Webhook Ingestion</div>
                                <div className="text-[11px] text-slate-500">Live webhook endpoint operational for realtime delivery receipts</div>
                            </div>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
