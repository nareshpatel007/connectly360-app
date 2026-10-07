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
import { PageHeader } from "@/components/page-header";

export default function IntegrationsPage() {
    return (
        <div className="space-y-6 w-full">
            {/* Page Header */}
            <PageHeader
                icon={Plug}
                title="Channels & Integrations"
                description="Connect official channels, REST APIs, webhooks, and third-party tools to automate your messaging workflow."
                breadcrumbs={[{ label: "Channels & Integrations" }]}
            />

            {/* Channels & Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* WhatsApp Cloud API Card */}
                <div className="bg-white border border-[#E5E9EE] rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
                                <MessageCircle size={18} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 size={12} /> Active Channel
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">WhatsApp Business WABA</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Official Meta Cloud API integration for broadcasting, automated templates, and shared inbox.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/whatsapp"
                        className="w-full py-2 px-3.5 bg-[#2F8F83] hover:bg-[#267A70] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                        Manage WhatsApp WABA <ArrowRight size={13} />
                    </Link>
                </div>

                {/* API Keys Card */}
                <div className="bg-white border border-[#E5E9EE] rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-9 rounded-lg bg-[#E8F6F3] text-[#2F8F83] flex items-center justify-center font-bold border border-[#BFE4DD]">
                                <Key size={18} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6B7A] bg-slate-100 px-2 py-0.5 rounded-md">
                                REST API
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">API Keys</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Generate secure Bearer tokens for programmatically sending messages and querying contacts.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/api-keys"
                        className="w-full py-2 px-3.5 bg-[#172033] hover:bg-slate-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                        Configure API Keys <ArrowRight size={13} />
                    </Link>
                </div>

                {/* Webhooks Card */}
                <div className="bg-white border border-[#E5E9EE] rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-9 w-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold border border-cyan-100">
                                <Webhook size={18} />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6B7A] bg-slate-100 px-2 py-0.5 rounded-md">
                                Realtime Events
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#172033]">Webhooks</h3>
                            <p className="text-xs text-[#5F6B7A] mt-1 leading-relaxed">
                                Receive instant HTTP callback notifications for incoming messages, lead updates, and delivery status.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/integrations/webhooks"
                        className="w-full py-2 px-3.5 bg-[#172033] hover:bg-slate-800 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                        Configure Webhooks <ArrowRight size={13} />
                    </Link>
                </div>
            </div>

            {/* Developer Hub Link Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#2F8F83]/90 rounded-xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-700">
                <div className="space-y-1">
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-white/10 text-teal-300 rounded-md">
                        Developer Tools
                    </span>
                    <h3 className="text-base font-semibold">Looking for API Logs and Documentation?</h3>
                    <p className="text-xs text-slate-300">
                        Inspect request logs, delivery retry queues, rate limits, and interactive API specs.
                    </p>
                </div>
                <Link
                    href="/developer"
                    className="px-4 py-2 bg-white text-[#172033] hover:bg-slate-100 font-medium text-xs rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                    Open Developer Console
                </Link>
            </div>
        </div>
    );
}
