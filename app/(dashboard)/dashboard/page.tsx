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
    Users, TrendingUp, MessageSquare, Plus, RefreshCw, Sparkles, Loader2,
    CheckCircle2, Shield, Zap, X, Copy, Check, ChevronRight, Megaphone,
    ExternalLink, BookOpen, FileText, ArrowRight, MessageCircle, HelpCircle, Mail,
    Bot, Brain, AlertTriangle, CreditCard, GitBranch, ArrowUpRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { BuyCreditsModal } from "@/components/buy-credits-modal";

export default function DashboardPage() {
    const { user, token } = useAuth();
    const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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
        <div className="space-y-6 pb-12 font-sans">
            {/* PAGE HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Welcome back, <span className="font-bold text-slate-800">{user?.name || "User"}</span>. Here&apos;s what&apos;s happening with your workspace today.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                        <RefreshCw size={14} className="mr-1.5" />
                        Refresh
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="h-9 px-4 rounded-xl bg-[#00382B] hover:bg-[#35877D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0"
                    >
                        <Sparkles size={14} className="mr-1.5 text-emerald-300" />
                        Buy Credits
                    </Button>
                </div>
            </div>

            {/* CRITICAL / LOW CREDIT WARNING ALERT */}
            {isZeroCredits ? (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-rose-900">Your Credit Balance is 0</h3>
                            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                                Automated replies, AI resolutions, and WhatsApp campaigns are currently paused. Recharge credits now to resume uninterrupted service.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 shadow-xs cursor-pointer border-0"
                    >
                        <Zap size={14} className="mr-1.5 fill-white" />
                        Recharge Credits
                    </Button>
                </div>
            ) : isLowCredits ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Low Credit Balance: {credits} Credits Remaining</h3>
                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                You are running low on credits. Refill your wallet to ensure your AI agents and campaigns continue running without interruption.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl h-9 px-4 shrink-0 shadow-xs cursor-pointer border-0"
                    >
                        <Zap size={14} className="mr-1.5 fill-white" />
                        Refill Credits
                    </Button>
                </div>
            ) : null}

            {/* WORKSPACE & WALLET SUMMARY CARD */}
            <Card className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-[#00382B] via-[#35877D] to-emerald-400" />
                
                <div className="flex items-center gap-4">
                    <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#00382B] to-[#35877D] text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-bold text-slate-900 text-base leading-none">
                                {user?.name ? `${user.name}'s Workspace` : "My Workspace"}
                            </h2>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest">
                                PAY AS YOU GO
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span>Company ID:</span>
                            <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 select-all font-bold">
                                {user?.company_id || "6a40a10a3d471f6bc17f5ffa"}
                            </span>
                            <button
                                onClick={copyCompanyId}
                                className="hover:text-[#35877D] hover:bg-slate-100 rounded p-1 transition-colors cursor-pointer"
                                title="Copy Company ID"
                            >
                                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 self-start md:self-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto">
                    <div className="flex flex-col items-start md:items-end w-full sm:w-auto">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Available Credits</span>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#35877D]/10 text-[#35877D] border border-[#35877D]/20 font-black text-lg">
                                <Zap size={16} className="fill-[#35877D]" />
                                <span>{credits.toLocaleString()}</span>
                            </div>
                            <Button
                                onClick={() => setIsBuyCreditsOpen(true)}
                                className="text-xs font-bold text-white bg-[#00382B] hover:bg-[#35877D] transition-all px-3.5 py-1.5 rounded-xl shadow-xs h-9 cursor-pointer border-0"
                            >
                                Buy Credits
                            </Button>
                            <Button
                                variant="outline"
                                asChild
                                className="text-xs font-semibold text-slate-700 hover:text-[#35877D] border-slate-200 h-9 rounded-xl cursor-pointer"
                            >
                                <Link href="/billing">History</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* WHATSAPP BUSINESS SETUP OR CONNECTED BANNER */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#35877D]/10 via-slate-50 to-[#35877D]/5 border border-[#35877D]/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                {isWhatsappConnected ? (
                    <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                    Official WhatsApp Connected
                                </span>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                                WhatsApp WABA Active ({whatsappStatus?.phoneNumber || "+91 95865 57103"})
                            </h2>
                            <p className="text-xs text-slate-600 max-w-lg leading-relaxed">
                                Your official WhatsApp Business account is active. Automated AI agents are processing incoming messages and converting leads 24/7.
                            </p>
                        </div>
                        <Button
                            asChild
                            className="bg-[#35877D] hover:bg-[#2b6e66] text-white rounded-xl text-xs font-bold px-5 h-10 shadow-xs border-0 shrink-0 cursor-pointer"
                        >
                            <Link href="/integrations/whatsapp">
                                Manage WhatsApp Connection
                                <ArrowRight size={14} className="ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3 max-w-md text-center md:text-left">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#35877D]/10 border border-[#35877D]/20 text-[#35877D] text-[10px] font-extrabold uppercase">
                                <MessageCircle size={12} />
                                Official Meta WhatsApp Setup
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                Complete your WhatsApp API Sandbox setup!
                            </h2>
                            <p className="text-xs text-slate-600 font-normal leading-relaxed">
                                Link your official business phone number and deploy your customized AI agents to production WhatsApp channels.
                            </p>
                            <div className="pt-1">
                                <Button
                                    asChild
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-5 h-10 shadow-sm border-0 cursor-pointer"
                                >
                                    <Link href="/integrations/whatsapp">
                                        Start Setup Wizard
                                        <ChevronRight size={14} className="ml-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white border border-[#35877D]/20 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all duration-300 select-none shrink-0 w-full sm:w-auto relative">
                            <div className="relative flex items-center gap-4 w-full justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center shrink-0">
                                        <MessageCircle size={20} className="fill-[#35877D]/20" />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <p className="text-xs font-bold text-slate-900 tracking-tight leading-none">Test Sandbox AI</p>
                                        <p className="text-[10px] text-slate-500 font-medium">Scan to chat on WhatsApp</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-xs" />
                                            <span className="text-[9.5px] text-emerald-600 font-extrabold tracking-wide uppercase">Online & Active</span>
                                        </div>
                                    </div>
                                </div>
                                <a 
                                    href="https://wa.me/919586557103?text=Hello" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="ml-auto sm:ml-4 border border-slate-200 rounded-xl p-1 bg-white shadow-2xs hover:border-[#35877D] hover:scale-105 transition-all duration-300 cursor-pointer flex items-center justify-center shrink-0"
                                    title="Click to test chat directly"
                                >
                                    <img 
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://wa.me/919586557103?text=Hello" 
                                        alt="WhatsApp Testing QR Code" 
                                        className="h-14 w-14 object-contain" 
                                    />
                                </a>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* KPI METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Metric 1: Total Leads */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2.5 shadow-2xs relative overflow-hidden group hover:border-[#35877D]/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                            <Users size={16} />
                        </div>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            +12% wk
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Leads</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                            {isLoadingLeads ? (
                                <Skeleton className="h-7 w-16 mt-1" />
                            ) : (
                                leads?.length || summary?.totalLeads || 0
                            )}
                        </h3>
                    </div>
                </div>

                {/* Metric 2: AI Resolution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2.5 shadow-2xs relative overflow-hidden group hover:border-[#35877D]/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                            <Bot size={16} />
                        </div>
                        <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            Top Tier
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AI Resolution</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">95.2%</h3>
                    </div>
                </div>

                {/* Metric 3: Total Chats */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2.5 shadow-2xs relative overflow-hidden group hover:border-[#35877D]/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 font-bold">
                            <MessageSquare size={16} />
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            Live Logs
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Chats</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                            {isLoadingConversations ? (
                                <Skeleton className="h-7 w-16 mt-1" />
                            ) : (
                                conversations?.length || summary?.totalMessages || 0
                            )}
                        </h3>
                    </div>
                </div>

                {/* Metric 4: Auto Workflows */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4.5 space-y-2.5 shadow-2xs relative overflow-hidden group hover:border-[#35877D]/40 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                            <Brain size={16} />
                        </div>
                        <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            SaaS AI
                        </span>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Auto Workflows</p>
                        <h3 className="text-2xl font-black text-slate-900 mt-0.5">
                            {automations ? `${automations.length} Active` : "3 Active"}
                        </h3>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <Link
                        href="/conversations"
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] group-hover:bg-[#35877D] group-hover:text-white flex items-center justify-center transition-colors">
                            <MessageSquare size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">Open Inbox</span>
                    </Link>

                    <Link
                        href="/contacts"
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] group-hover:bg-[#35877D] group-hover:text-white flex items-center justify-center transition-colors">
                            <Users size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">Add Contact</span>
                    </Link>

                    <Link
                        href="/leads"
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] group-hover:bg-[#35877D] group-hover:text-white flex items-center justify-center transition-colors">
                            <GitBranch size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">Lead Pipeline</span>
                    </Link>

                    <Link
                        href="/marketing/campaigns"
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] group-hover:bg-[#35877D] group-hover:text-white flex items-center justify-center transition-colors">
                            <Megaphone size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">New Campaign</span>
                    </Link>

                    <Link
                        href="/ai-assistant"
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] group-hover:bg-[#35877D] group-hover:text-white flex items-center justify-center transition-colors">
                            <Bot size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">AI Settings</span>
                    </Link>

                    <button
                        onClick={() => setIsBuyCreditsOpen(true)}
                        className="p-3 bg-white border border-slate-200 hover:border-[#35877D] hover:bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-center gap-2 group transition-all shadow-2xs cursor-pointer"
                    >
                        <div className="h-9 w-9 rounded-xl bg-[#00382B] text-white group-hover:bg-[#35877D] flex items-center justify-center transition-colors">
                            <Sparkles size={16} className="text-emerald-300" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#35877D]">Buy Credits</span>
                    </button>
                </div>
            </div>

            {/* TWO COLUMN CONTENT LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: RECENT CONVERSATIONS & RECENT LEADS */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Recent Conversations Card */}
                    <Card className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={16} className="text-[#35877D]" />
                                <h3 className="text-sm font-bold text-slate-900">Recent Conversations</h3>
                            </div>
                            <Link href="/conversations" className="text-xs font-bold text-[#35877D] hover:underline flex items-center gap-1">
                                View Inbox <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {isLoadingConversations ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="space-y-1.5 w-full">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                ))
                            ) : conversations && conversations.length > 0 ? (
                                conversations.slice(0, 4).map((chat) => (
                                    <Link
                                        key={chat.id}
                                        href="/conversations"
                                        className="p-3 rounded-xl border border-slate-100 hover:border-[#35877D]/30 hover:bg-slate-50/70 flex items-center justify-between gap-3 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-bold text-xs shrink-0">
                                                {chat.customerName ? chat.customerName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#35877D] truncate">
                                                        {chat.customerName || chat.customerPhone}
                                                    </p>
                                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${chat.direction === 'inbound' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                        {chat.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {chat.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-semibold text-slate-400">
                                                {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                                    <MessageSquare size={24} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-bold text-slate-700">No active conversations yet</p>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                                        Scan the sandbox QR code or connect your official WhatsApp account to start receiving customer messages.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Leads Card */}
                    <Card className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <GitBranch size={16} className="text-[#35877D]" />
                                <h3 className="text-sm font-bold text-slate-900">Recent Leads</h3>
                            </div>
                            <Link href="/leads" className="text-xs font-bold text-[#35877D] hover:underline flex items-center gap-1">
                                Pipeline View <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="space-y-2">
                            {isLoadingLeads ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="space-y-1.5 w-full">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                    </div>
                                ))
                            ) : leads && leads.length > 0 ? (
                                leads.slice(0, 4).map((lead) => (
                                    <Link
                                        key={lead.id}
                                        href="/leads"
                                        className="p-3 rounded-xl border border-slate-100 hover:border-[#35877D]/30 hover:bg-slate-50/70 flex items-center justify-between gap-3 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : "L"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 group-hover:text-[#35877D] truncate">
                                                    {lead.customerName || lead.phone}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {lead.phone} • {lead.location || "WhatsApp Channel"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                                lead.status === 'converted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                lead.status === 'contacted' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                                lead.status === 'lost' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {lead.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                                    <Users size={24} className="mx-auto text-slate-300" />
                                    <p className="text-xs font-bold text-slate-700">No leads in pipeline yet</p>
                                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                                        Import contacts or enable automated AI lead capture to populate your sales pipeline.
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN: CREDIT USAGE & SUPPORT & RESOURCES */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Credit Usage Breakdown Card */}
                    <Card className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Zap size={16} className="text-[#35877D] fill-[#35877D]/20" />
                                <h3 className="text-sm font-bold text-slate-900">Credit Distribution</h3>
                            </div>
                            <Link href="/reports/usage-reports" className="text-xs font-bold text-[#35877D] hover:underline">
                                Reports →
                            </Link>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                                    <span>AI Assistant Resolutions</span>
                                    <span>54%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#35877D] rounded-full" style={{ width: '54%' }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                                    <span>WhatsApp Broadcasts</span>
                                    <span>32%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '32%' }} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                                    <span>Automated Workflows</span>
                                    <span>14%</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '14%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-500">Current Balance:</span>
                            <span className="font-bold text-[#35877D]">{credits.toLocaleString()} Credits</span>
                        </div>
                    </Card>

                    {/* Support Card */}
                    <Card className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center shrink-0">
                                <HelpCircle size={18} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-900">Need Support?</h4>
                                <p className="text-[11px] text-slate-500">Our customer team is available 24/7</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs font-medium pt-1">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Email Support:</span>
                                <span className="text-slate-900 font-bold select-all">support@connectly360.com</span>
                            </div>
                            <div className="flex items-start justify-between gap-4 text-slate-600">
                                <span>Feedback:</span>
                                <span className="text-slate-700 text-right leading-normal">
                                    Submit feature requests &amp; feedback
                                </span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                            <button
                                onClick={() => setIsBuyCreditsOpen(true)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#35877D] hover:underline cursor-pointer"
                            >
                                Buy Credit Packs
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </Card>

                    {/* Resources Card */}
                    <Card className="bg-white border border-slate-200 shadow-2xs rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Resources & Docs</h4>

                        <div className="space-y-3.5">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                    <FileText size={15} />
                                </div>
                                <div>
                                    <Link href="/knowledge-base" className="text-xs font-bold text-slate-900 hover:text-[#35877D] transition-colors flex items-center gap-1">
                                        Product Documentation
                                        <ArrowUpRight size={12} />
                                    </Link>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                        Comprehensive guides to configure AI agents, WABA sandbox &amp; workflows.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                                    <Zap size={14} />
                                </div>
                                <div>
                                    <Link href="/integrations/api-keys" className="text-xs font-bold text-slate-900 hover:text-[#35877D] transition-colors flex items-center gap-1">
                                        API Reference
                                        <ArrowUpRight size={12} />
                                    </Link>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                        Integrate Connectly360 REST endpoints and webhooks into your app.
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
