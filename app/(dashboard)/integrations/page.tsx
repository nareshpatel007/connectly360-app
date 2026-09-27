"use client";

import React from "react";
import Link from "next/link";
import {
    Plug,
    MessageCircle,
    Key,
    Webhook,
    CheckCircle2,
    ArrowRight,
    Globe,
    Zap,
    ExternalLink,
    ShieldCheck,
    Cpu
} from "lucide-react";

export default function IntegrationsPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Page Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Plug className="h-6 w-6 text-[#35877D]" />
                    Channels & Integrations Hub
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Connect official channels, REST APIs, webhooks, and third-party tools to automate your messaging workflow.
                </p>
            </div>

            {/* Channels & Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* WhatsApp Cloud API Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                <MessageCircle size={22} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 size={12} /> Active Channel
                            </span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">WhatsApp Business WABA</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Official Meta Cloud API integration for broadcasting, automated templates, and shared inbox.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/whatsapp"
                        className="w-full py-2.5 px-4 bg-[#35877D] hover:bg-[#2c6e66] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        Manage WhatsApp WABA <ArrowRight size={14} />
                    </Link>
                </div>

                {/* API Keys Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold">
                                <Key size={22} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                                REST API
                            </span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">API Keys</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Generate secure Bearer tokens for programmatically sending messages and querying contacts.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/api-keys"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        Configure API Keys <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Webhooks Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                                <Webhook size={22} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                                Realtime Events
                            </span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Webhooks</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Receive instant HTTP callback notifications for incoming messages, lead updates, and delivery status.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/webhooks"
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        Configure Webhooks <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* Developer Hub Link Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#35877D]/90 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-white/10 text-teal-300 rounded-md">
                        Developer Tools
                    </span>
                    <h3 className="text-lg font-bold">Looking for API Logs and Documentation?</h3>
                    <p className="text-xs text-slate-300">
                        Inspect request logs, delivery retry queues, rate limits, and interactive API specs.
                    </p>
                </div>
                <Link
                    href="/developer"
                    className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                    Open Developer Console
                </Link>
            </div>
        </div>
    );
}
