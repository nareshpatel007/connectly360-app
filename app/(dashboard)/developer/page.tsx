"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    Code2,
    Key,
    Webhook,
    Terminal,
    BookOpen,
    Copy,
    Check,
    RefreshCw,
    ShieldCheck,
    ExternalLink,
    Activity,
    Clock
} from "lucide-react";
import { toast } from "sonner";

export default function DeveloperPage() {
    const [copied, setCopied] = useState(false);

    const sampleToken = "c360_live_8f91a2b0c3d4e5f67890abcdef123456";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sampleToken);
        setCopied(true);
        toast.success("API token copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Code2 className="h-6 w-6 text-[#35877D]" />
                    Developer Platform
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    API keys, webhook callbacks, request logging, and developer documentation.
                </p>
            </div>

            {/* Sub-navigation Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/integrations/api-keys"
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#35877D] hover:shadow-sm transition-all group flex items-start gap-4"
                >
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold shrink-0">
                        <Key size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#35877D] transition-colors">
                            API Keys & Credentials
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Manage REST API secrets and access tokens.</p>
                    </div>
                </Link>

                <Link
                    href="/integrations/webhooks"
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#35877D] hover:shadow-sm transition-all group flex items-start gap-4"
                >
                    <div className="h-10 w-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0">
                        <Webhook size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#35877D] transition-colors">
                            Webhook Endpoints
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Configure event listeners and signature verification keys.</p>
                    </div>
                </Link>

                <Link
                    href="/developer/api-logs"
                    className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-[#35877D] hover:shadow-sm transition-all group flex items-start gap-4"
                >
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        <Terminal size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#35877D] transition-colors">
                            API Logs & Monitoring
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Inspect incoming and outgoing API traffic, HTTP status codes.</p>
                    </div>
                </Link>
            </div>

            {/* Quickstart Code Example */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-lg font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-300 font-bold font-sans">
                        <Terminal size={16} className="text-[#35877D]" />
                        cURL API Example - Send WhatsApp Message
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer text-xs font-sans"
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {copied ? "Copied!" : "Copy Snippet"}
                    </button>
                </div>
                <pre className="overflow-x-auto text-emerald-400 p-2 leading-relaxed">
{`curl -X POST https://api.connectly360.com/v1/whatsapp/send \\
  -H "Authorization: Bearer ${sampleToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+15550192837",
    "type": "text",
    "text": { "body": "Hello from Connectly360 API!" }
  }'`}
                </pre>
            </div>

            {/* Rate Limits & Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-[#35877D]" />
                    Workspace Rate Limits & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Rate Limit</p>
                        <p className="text-lg font-black text-slate-900">1,000 req / min</p>
                        <p className="text-[10px] text-slate-400">Standard Tier Limit</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Uptime Status</p>
                        <p className="text-lg font-black text-emerald-600">99.98% Healthy</p>
                        <p className="text-[10px] text-slate-400">All services operational</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">Avg Response Time</p>
                        <p className="text-lg font-black text-slate-900">142 ms</p>
                        <p className="text-[10px] text-slate-400">Last 24 Hours</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
