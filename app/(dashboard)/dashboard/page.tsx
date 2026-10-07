"use client";

import { useState, useEffect } from "react";
import {
    useGetAnalyticsSummary,
    useListConversations,
    useListLeads,
    useGetWhatsappStatus,
    useListAutomations
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import {
    Users, MessageSquare, RefreshCw, Sparkles,
    CheckCircle2, Zap, X, Copy, Check, ChevronRight, Megaphone,
    FileText, ArrowRight, MessageCircle, HelpCircle,
    Bot, Brain, AlertTriangle, GitBranch, ArrowUpRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { BuyCreditsModal } from "@/components/buy-credits-modal";

export default function DashboardPage() {
    const { user } = useAuth();
    const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isAlertDismissed, setIsAlertDismissed] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && sessionStorage.getItem("low_credits_alert_dismissed") === "true") {
            setIsAlertDismissed(true);
        }
    }, []);

    const handleDismissAlert = () => {
        setIsAlertDismissed(true);
        if (typeof window !== "undefined") {
            sessionStorage.setItem("low_credits_alert_dismissed", "true");
        }
    };

    // TanStack Query API hooks
    const { data: summary, isLoading: isLoadingSummary, refetch: refetchSummary } = useGetAnalyticsSummary();
    const { data: conversations, isLoading: isLoadingConversations, refetch: refetchConversations } = useListConversations({ limit: 5 });
    const { data: leads, isLoading: isLoadingLeads, refetch: refetchLeads } = useListLeads();
    const { data: whatsappStatus, isLoading: isLoadingWhatsapp, refetch: refetchWhatsapp } = useGetWhatsappStatus();
    const { data: automations } = useListAutomations();

    const handleRefresh = () => {
        refetchSummary();
        refetchConversations();
        refetchLeads();
        refetchWhatsapp();
        toast.success("Dashboard metrics refreshed");
    };

    const copyCompanyId = () => {
        const companyId = user?.company_id || "6a40a10a3d471f6bc17f5ffa";
        navigator.clipboard.writeText(companyId);
        setCopied(true);
        toast.success("Company ID copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const credits = Number(user?.credits || 0);
    const isZeroCredits = credits <= 0;
    const isLowCredits = credits > 0 && credits <= 100;
    const isWhatsappConnected = whatsappStatus?.status === "connected";

    return (
        <div className="space-y-5 pb-12 font-sans w-full">
            {/* 1. COMPACT PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E9EE] pb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#172033] tracking-tight">Dashboard</h1>
                    <p className="text-[13px] text-[#5F6B7A] mt-0.5">
                        Welcome back, <span className="font-medium text-[#172033]">{user?.name || "User"}</span>. Here&apos;s what&apos;s happening with your workspace today.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="h-9 px-3.5 rounded-lg border-[#E5E9EE] bg-white text-[#172033] hover:bg-slate-50 text-xs font-medium cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={13} className="mr-1.5 text-[#5F6B7A]" />
                        Refresh Data
                    </Button>

                    <Button
                        size="sm"
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="h-9 px-3.5 rounded-lg bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer border-0"
                    >
                        <Sparkles size={13} className="mr-1.5 text-emerald-200" />
                        Buy Credits
                    </Button>
                </div>
            </div>

            {/* CRITICAL / LOW CREDIT INLINE WARNING (Subtle, non-marketing) */}
            {isZeroCredits && !isAlertDismissed ? (
                <div className="bg-[#FFF0F0] border border-[#FCD8D8] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-100 text-[#D95C5C] flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-[#B32626]">Credit balance is zero</h3>
                            <p className="text-xs text-[#8A3030] mt-0.5">
                                Automated replies, AI resolutions, and WhatsApp campaigns are paused. Recharge credits to resume service.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                            size="sm"
                            onClick={() => setIsBuyCreditsOpen(true)}
                            className="bg-[#D95C5C] hover:bg-[#c44949] text-white text-xs font-medium rounded-lg h-8 px-3 cursor-pointer border-0 shadow-2xs"
                        >
                            <Zap size={12} className="mr-1 fill-white" />
                            Recharge
                        </Button>
                        <button
                            onClick={handleDismissAlert}
                            className="text-rose-400 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
                            title="Dismiss alert"
                            aria-label="Dismiss low credits message"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            ) : isLowCredits && !isAlertDismissed ? (
                <div className="bg-[#FFF7E6] border border-[#FFE7BA] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-[#D79A2B] flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold text-[#8C580B]">Low credit balance ({credits} credits remaining)</h3>
                            <p className="text-xs text-[#8C580B]/90 mt-0.5">
                                Recharge your wallet to ensure your AI agents and campaigns continue running without interruption.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                            size="sm"
                            onClick={() => setIsBuyCreditsOpen(true)}
                            className="bg-[#D79A2B] hover:bg-[#b88222] text-white text-xs font-medium rounded-lg h-8 px-3 cursor-pointer border-0 shadow-2xs"
                        >
                            <Zap size={12} className="mr-1 fill-white" />
                            Refill
                        </Button>
                        <button
                            onClick={handleDismissAlert}
                            className="text-amber-500 hover:text-amber-800 p-1 rounded-md transition-colors cursor-pointer"
                            title="Dismiss alert"
                            aria-label="Dismiss low credits message"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            ) : null}

            {/* 2. COMPACT WORKSPACE & WALLET SUMMARY CARD (Height ~100-120px desktop) */}
            <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Avatar & Workspace Metadata */}
                    <div className="flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-lg bg-[#E8F6F3] text-[#2F8F83] border border-[#BFE4DD] flex items-center justify-center font-semibold text-lg shrink-0">
                            {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold text-[#172033] text-base leading-none">
                                    {user?.name ? `${user.name}'s Workspace` : "Workspace"}
                                </h2>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-[#5F6B7A] tracking-wider uppercase">
                                    PAY AS YOU GO
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#5F6B7A]">
                                <span>Company ID:</span>
                                <span className="font-mono text-[11px] text-[#2F8F83] bg-[#F7F9FA] px-2 py-0.5 rounded border border-[#E5E9EE] select-all font-medium">
                                    {user?.company_id || "6a40a10a3d471f6bc17f5ffa"}
                                </span>
                                <button
                                    onClick={copyCompanyId}
                                    className="hover:text-[#2F8F83] hover:bg-slate-100 rounded p-1 transition-colors cursor-pointer text-[#8A95A3]"
                                    title="Copy Company ID"
                                >
                                    {copied ? <Check size={12} className="text-[#2F8F83]" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Available Credits & Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E9EE]">
                        <div className="flex items-center gap-2.5 bg-[#F7F9FA] px-3.5 py-2 rounded-lg border border-[#E5E9EE]">
                            <div>
                                <span className="text-[10px] font-medium text-[#8A95A3] uppercase tracking-wider block">Available Credits</span>
                                <div className="flex items-center gap-1 text-[#172033] font-semibold text-lg leading-tight mt-0.5">
                                    <Zap size={14} className="fill-[#2F8F83] text-[#2F8F83]" />
                                    <span>{credits.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setIsBuyCreditsOpen(true)}
                                className="h-9 px-3.5 rounded-lg bg-[#2F8F83] hover:bg-[#267A70] text-white text-xs font-medium cursor-pointer border-0 shadow-2xs"
                            >
                                Buy Credits
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-9 px-3 rounded-lg border-[#E5E9EE] bg-white text-[#5F6B7A] hover:text-[#172033] hover:bg-slate-50 text-xs font-medium cursor-pointer shadow-2xs"
                            >
                                <Link href="/billing">History</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 3. COMPACT WHATSAPP CONNECTION CARD */}
            <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 sm:p-5 shadow-2xs">
                {isWhatsappConnected ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EAF8F2] text-[#268263] border border-[#BFE4DD]/50">
                                    <span className="h-2 w-2 rounded-full bg-[#2E9B72]" />
                                    Connected
                                </span>
                                <span className="text-xs font-medium text-[#172033]">
                                    WhatsApp Business ({whatsappStatus?.phoneNumber || "+91 95865 57103"})
                                </span>
                            </div>
                            <p className="text-xs text-[#5F6B7A]">
                                Official WhatsApp Cloud API • Connected and receiving messages in real time.
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8.5 px-3.5 rounded-lg border-[#E5E9EE] bg-white hover:bg-slate-50 text-xs font-medium text-[#172033] shrink-0 cursor-pointer"
                        >
                            <Link href="/integrations/whatsapp">
                                Manage
                                <ArrowRight size={13} className="ml-1 text-[#8A95A3]" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#2F8F83] bg-[#E8F6F3] px-2 py-0.5 rounded-md border border-[#BFE4DD]">
                                <MessageCircle size={12} />
                                Meta WhatsApp Sandbox Setup
                            </div>
                            <h3 className="text-sm font-semibold text-[#172033]">
                                Complete your WhatsApp API Sandbox setup
                            </h3>
                            <p className="text-xs text-[#5F6B7A]">
                                Link your business phone number and deploy your customized AI agents to production WhatsApp channels.
                            </p>
                            <div className="pt-1.5">
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-[#2F8F83] hover:bg-[#267A70] text-white rounded-lg text-xs font-medium px-3.5 h-8 border-0 cursor-pointer shadow-2xs"
                                >
                                    <Link href="/integrations/whatsapp">
                                        Start Setup Wizard
                                        <ChevronRight size={13} className="ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Test Sandbox Chat QR Tile */}
                        <div className="flex items-center gap-3 bg-[#F7F9FA] border border-[#E5E9EE] rounded-lg p-2.5 shrink-0 self-start md:self-auto">
                            <div className="space-y-0.5 text-left pr-2">
                                <p className="text-xs font-medium text-[#172033]">Test Sandbox AI</p>
                                <p className="text-[11px] text-[#8A95A3]">Scan to test chat</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#2E9B72]" />
                                    <span className="text-[10px] text-[#268263] font-medium">Online</span>
                                </div>
                            </div>
                            <a 
                                href="https://wa.me/919586557103?text=Hello" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="border border-[#E5E9EE] rounded-md p-1 bg-white hover:border-[#2F8F83] transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                title="Click to test chat directly"
                            >
                                <img 
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://wa.me/919586557103?text=Hello" 
                                    alt="WhatsApp Testing QR Code" 
                                    className="h-11 w-11 object-contain rounded" 
                                />
                            </a>
                        </div>
                    </div>
                )}
            </Card>

            {/* 4. COMPACT OPERATIONAL KPI METRIC CARDS (4 equal-height cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Metric 1: Total Leads */}
                <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center shrink-0">
                            <Users size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-[#268263] bg-[#EAF8F2] border border-[#BFE4DD]/40 px-2 py-0.5 rounded-full">
                            +12% wk
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5F6B7A]">Total Leads</p>
                        <h3 className="text-2xl font-semibold text-[#172033] mt-0.5">
                            {isLoadingLeads ? (
                                <Skeleton className="h-7 w-14 mt-1" />
                            ) : (
                                leads?.length ?? summary?.totalLeads ?? 0
                            )}
                        </h3>
                    </div>
                </Card>

                {/* Metric 2: AI Resolution */}
                <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-[#EEF4FF] text-[#4F7FCB] flex items-center justify-center shrink-0">
                            <Bot size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-[#4F7FCB] bg-[#EEF4FF] border border-[#D0E1FD] px-2 py-0.5 rounded-full">
                            Active
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5F6B7A]">AI Resolution</p>
                        <h3 className="text-2xl font-semibold text-[#172033] mt-0.5">
                            —
                        </h3>
                    </div>
                </Card>

                {/* Metric 3: Total Chats */}
                <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-[#F0FDF4] text-[#2E9B72] flex items-center justify-center shrink-0">
                            <MessageSquare size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            Realtime
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5F6B7A]">Total Chats</p>
                        <h3 className="text-2xl font-semibold text-[#172033] mt-0.5">
                            {isLoadingConversations ? (
                                <Skeleton className="h-7 w-14 mt-1" />
                            ) : (
                                conversations?.length ?? summary?.totalMessages ?? 0
                            )}
                        </h3>
                    </div>
                </Card>

                {/* Metric 4: Auto Workflows */}
                <Card className="bg-white border-[#E5E9EE] rounded-xl p-4 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-[#FFF7E6] text-[#D79A2B] flex items-center justify-center shrink-0">
                            <Brain size={16} />
                        </div>
                        <span className="text-[10px] font-medium text-[#8C580B] bg-[#FFF7E6] border border-[#FFE7BA] px-2 py-0.5 rounded-full">
                            Workflows
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5F6B7A]">Auto Workflows</p>
                        <h3 className="text-2xl font-semibold text-[#172033] mt-0.5">
                            {automations ? `${automations.length} Active` : "—"}
                        </h3>
                    </div>
                </Card>
            </div>

            {/* 5. COMPACT QUICK ACTIONS TILES (Height ~72-80px) */}
            <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#8A95A3] uppercase tracking-wider px-0.5">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <Link
                        href="/conversations"
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center transition-colors">
                            <MessageSquare size={16} />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">Open Inbox</span>
                    </Link>

                    <Link
                        href="/contacts"
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center transition-colors">
                            <Users size={16} />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">Add Contact</span>
                    </Link>

                    <Link
                        href="/leads"
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center transition-colors">
                            <GitBranch size={16} />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">Lead Pipeline</span>
                    </Link>

                    <Link
                        href="/marketing/campaigns"
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center transition-colors">
                            <Megaphone size={16} />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">New Campaign</span>
                    </Link>

                    <Link
                        href="/ai-assistant"
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center transition-colors">
                            <Bot size={16} />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">AI Settings</span>
                    </Link>

                    <button
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="p-3 bg-white border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] rounded-xl flex flex-col items-center justify-center text-center gap-1.5 group transition-colors shadow-2xs cursor-pointer"
                    >
                        <div className="h-8 w-8 rounded-lg bg-[#2F8F83] text-white flex items-center justify-center transition-colors">
                            <Sparkles size={16} className="text-emerald-200" />
                        </div>
                        <span className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83]">Buy Credits</span>
                    </button>
                </div>
            </div>

            {/* 6. CONTENT LAYOUT (8 cols Recent Data + 4 cols Credit Breakdown & Support) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* LEFT COLUMN: RECENT CONVERSATIONS & RECENT LEADS (8 cols) */}
                <div className="lg:col-span-8 space-y-5">
                    
                    {/* Recent Conversations */}
                    <Card className="bg-white border-[#E5E9EE] rounded-xl p-5 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#E5E9EE] pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={15} className="text-[#2F8F83]" />
                                <h3 className="text-sm font-semibold text-[#172033]">Recent Conversations</h3>
                            </div>
                            <Link href="/conversations" className="text-xs font-medium text-[#2F8F83] hover:underline flex items-center gap-1">
                                View Inbox <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-1.5">
                            {isLoadingConversations ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-[#E5E9EE] flex items-center justify-between">
                                        <div className="space-y-1.5 w-full">
                                            <Skeleton className="h-3.5 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                ))
                            ) : conversations && conversations.length > 0 ? (
                                conversations.slice(0, 4).map((chat) => (
                                    <Link
                                        key={chat.id}
                                        href="/conversations"
                                        className="p-2.5 rounded-lg border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] flex items-center justify-between gap-3 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 rounded-full bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center font-medium text-xs shrink-0 border border-[#BFE4DD]">
                                                {chat.customerName ? chat.customerName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83] truncate">
                                                        {chat.customerName || chat.customerPhone}
                                                    </p>
                                                    <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded uppercase tracking-wider ${
                                                        chat.direction === 'inbound' 
                                                            ? 'bg-[#EAF8F2] text-[#268263] border border-[#BFE4DD]/40' 
                                                            : 'bg-slate-100 text-[#5F6B7A] border border-slate-200'
                                                    }`}>
                                                        {chat.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#5F6B7A] truncate mt-0.5 font-normal">
                                                    {chat.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-[#8A95A3]">
                                                {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-[#F7F9FA] rounded-lg border border-dashed border-[#E5E9EE] space-y-1.5">
                                    <MessageSquare size={22} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-semibold text-slate-700">No active conversations yet</p>
                                    <p className="text-[11px] text-[#5F6B7A] max-w-xs mx-auto">
                                        Scan the sandbox QR code or connect your official WhatsApp account to start receiving customer messages.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Leads */}
                    <Card className="bg-white border-[#E5E9EE] rounded-xl p-5 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#E5E9EE] pb-3">
                            <div className="flex items-center gap-2">
                                <GitBranch size={15} className="text-[#2F8F83]" />
                                <h3 className="text-sm font-semibold text-[#172033]">Recent Leads</h3>
                            </div>
                            <Link href="/leads" className="text-xs font-medium text-[#2F8F83] hover:underline flex items-center gap-1">
                                Pipeline View <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-1.5">
                            {isLoadingLeads ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-[#E5E9EE] flex items-center justify-between">
                                        <div className="space-y-1.5 w-full">
                                            <Skeleton className="h-3.5 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    </div>
                                ))
                            ) : leads && leads.length > 0 ? (
                                leads.slice(0, 4).map((lead) => (
                                    <Link
                                        key={lead.id}
                                        href="/leads"
                                        className="p-2.5 rounded-lg border border-[#E5E9EE] hover:border-[#BFE4DD] hover:bg-[#F2FAF8] flex items-center justify-between gap-3 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center shrink-0 border border-slate-200">
                                                {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "L"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-[#172033] group-hover:text-[#2F8F83] truncate">
                                                    {lead.customerName || lead.phone}
                                                </p>
                                                <p className="text-[11px] text-[#5F6B7A] truncate mt-0.5 font-normal">
                                                    {lead.phone} • {lead.location || "WhatsApp"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full ${
                                                lead.status === 'converted' ? 'bg-[#EAF8F2] text-[#268263] border border-[#BFE4DD]/40' :
                                                lead.status === 'contacted' ? 'bg-[#EEF4FF] text-[#4F7FCB] border border-[#D0E1FD]' :
                                                lead.status === 'lost' ? 'bg-[#FFF0F0] text-[#D95C5C] border border-[#FCD8D8]' :
                                                'bg-[#FFF7E6] text-[#D79A2B] border border-[#FFE7BA]'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-[#F7F9FA] rounded-lg border border-dashed border-[#E5E9EE] space-y-1.5">
                                    <Users size={22} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-semibold text-slate-700">No leads in pipeline yet</p>
                                    <p className="text-[11px] text-[#5F6B7A] max-w-xs mx-auto">
                                        Import contacts or enable automated AI lead capture to populate your sales pipeline.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN: CREDIT USAGE & SUPPORT & RESOURCES (4 cols) */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Credit Usage Breakdown Card */}
                    <Card className="bg-white border-[#E5E9EE] shadow-2xs rounded-xl p-5 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-[#E5E9EE] pb-3">
                            <div className="flex items-center gap-2">
                                <Zap size={15} className="text-[#2F8F83] fill-[#2F8F83]/20" />
                                <h3 className="text-sm font-semibold text-[#172033]">Credit Distribution</h3>
                            </div>
                            <Link href="/reports/usage-reports" className="text-xs font-medium text-[#2F8F83] hover:underline">
                                Reports →
                            </Link>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <div className="flex justify-between font-medium text-[#5F6B7A] text-[11px]">
                                    <span>AI Assistant Resolutions</span>
                                    <span className="text-[#172033] font-semibold">54%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#2F8F83] rounded-full" style={{ width: '54%' }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-medium text-[#5F6B7A] text-[11px]">
                                    <span>WhatsApp Broadcasts</span>
                                    <span className="text-[#172033] font-semibold">32%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#4F7FCB] rounded-full" style={{ width: '32%' }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-medium text-[#5F6B7A] text-[11px]">
                                    <span>Automated Workflows</span>
                                    <span className="text-[#172033] font-semibold">14%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#D79A2B] rounded-full" style={{ width: '14%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2.5 border-t border-[#E5E9EE] flex items-center justify-between text-xs">
                            <span className="font-normal text-[#5F6B7A]">Current Balance:</span>
                            <span className="font-semibold text-[#2F8F83]">{credits.toLocaleString()} Credits</span>
                        </div>
                    </Card>

                    {/* Support Card */}
                    <Card className="bg-white border-[#E5E9EE] shadow-2xs rounded-xl p-5 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center shrink-0 border border-[#BFE4DD]">
                                <HelpCircle size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-[#172033]">Need Support?</h4>
                                <p className="text-[11px] text-[#8A95A3]">Customer team available 24/7</p>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-xs font-normal pt-0.5">
                            <div className="flex items-center justify-between text-[#5F6B7A]">
                                <span>Email Support:</span>
                                <span className="text-[#172033] font-medium select-all">support@connectly360.com</span>
                            </div>
                            <div className="flex items-start justify-between gap-2 text-[#5F6B7A]">
                                <span>Feedback:</span>
                                <span className="text-[#172033] text-right font-medium">
                                    Submit feature requests
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-[#E5E9EE] pt-2 flex items-center justify-between">
                            <button
                                onClick={() => setIsBuyCreditsOpen(true)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#2F8F83] hover:underline cursor-pointer"
                            >
                                Buy Credit Packs
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </Card>

                    {/* Resources & Docs */}
                    <Card className="bg-white border-[#E5E9EE] shadow-2xs rounded-xl p-5 space-y-3">
                        <h4 className="text-[11px] font-semibold text-[#8A95A3] uppercase tracking-wider">Resources &amp; Docs</h4>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[#F7F9FA] text-[#5F6B7A] flex items-center justify-center shrink-0 mt-0.5 border border-[#E5E9EE]">
                                    <FileText size={14} />
                                </div>
                                <div>
                                    <Link href="/knowledge-base" className="text-xs font-medium text-[#172033] hover:text-[#2F8F83] transition-colors flex items-center gap-1">
                                        Product Documentation
                                        <ArrowUpRight size={12} className="text-[#8A95A3]" />
                                    </Link>
                                    <p className="text-[11px] text-[#8A95A3] mt-0.5 leading-normal">
                                        Guides to configure AI agents, WABA sandbox &amp; workflows.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-[#F7F9FA] text-[#5F6B7A] flex items-center justify-center shrink-0 mt-0.5 border border-[#E5E9EE]">
                                    <Zap size={14} />
                                </div>
                                <div>
                                    <Link href="/integrations/api-keys" className="text-xs font-medium text-[#172033] hover:text-[#2F8F83] transition-colors flex items-center gap-1">
                                        API Reference
                                        <ArrowUpRight size={12} className="text-[#8A95A3]" />
                                    </Link>
                                    <p className="text-[11px] text-[#8A95A3] mt-0.5 leading-normal">
                                        Integrate Connectly360 REST endpoints and webhooks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>

            {/* Buy Credits Modal */}
            <BuyCreditsModal
                open={isBuyCreditsOpen}
                onOpenChange={setIsBuyCreditsOpen}
            />
        </div>
    );
}
