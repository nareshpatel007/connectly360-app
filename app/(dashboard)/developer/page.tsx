"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    Code2,
    Key,
    Webhook,
    Terminal,
    Copy,
    Check,
    Activity,
    Clock,
    Zap,
    CheckCircle2,
    XCircle,
    ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";

interface DeveloperStats {
    active_keys_count: number;
    total_keys_count: number;
    requests_today: number;
    successful_requests: number;
    failed_requests: number;
    last_request_at: string;
}

export default function DeveloperPage() {
    const [copied, setCopied] = useState(false);
    const [stats, setStats] = useState<DeveloperStats>({
        active_keys_count: 0,
        total_keys_count: 0,
        requests_today: 0,
        successful_requests: 0,
        failed_requests: 0,
        last_request_at: "No requests yet",
    });

    useEffect(() => {
        fetch("/api/developer/stats")
            .then((res) => res.json())
            .then((json) => {
                if (json.success && json.data) {
                    setStats(json.data);
                }
            })
            .catch(() => {});
    }, []);

    const documentationSnippet = `curl -X POST https://api.connectly360.com/v1/whatsapp/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+15550192837",
    "type": "text",
    "text": { "body": "Hello from Connectly360 API!" }
  }'`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(documentationSnippet);
        setCopied(true);
        toast.success("cURL example copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                icon={Code2}
                title="Developer Platform"
                description="API keys, webhook callbacks, request logging, and developer documentation."
                breadcrumbs={[{ label: "Developer" }]}
            />

            {/* Sub-navigation Quick Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                    href="/integrations/api-keys"
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-[#35877D] hover:shadow-xs transition-all group flex items-start gap-4"
                >
                    <div className="h-10 w-10 rounded-xl bg-teal-50 text-[#35877D] flex items-center justify-center font-bold shrink-0">
                        <Key size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#35877D] transition-colors">
                                API Keys & Credentials
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#35877D]">
                                {stats.active_keys_count} Active
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Manage REST API secrets and access tokens.</p>
                    </div>
                </Link>

                <Link
                    href="/integrations/webhooks"
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-[#35877D] hover:shadow-xs transition-all group flex items-start gap-4"
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
                    className="p-5 bg-white border border-slate-200/80 rounded-2xl hover:border-[#35877D] hover:shadow-xs transition-all group flex items-start gap-4"
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

            {/* Dynamic Telemetry Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Active API Keys"
                    value={stats.active_keys_count.toString()}
                    icon={Key}
                    change={`${stats.total_keys_count} total`}
                    changeType="neutral"
                    subtitle="Workspace active credentials"
                />
                <StatCard
                    title="Requests Today"
                    value={stats.requests_today.toString()}
                    icon={Activity}
                    change="24h volume"
                    changeType="neutral"
                    subtitle="Inbound API calls"
                />
                <StatCard
                    title="Successful (2xx)"
                    value={stats.successful_requests.toString()}
                    icon={CheckCircle2}
                    change="Healthy"
                    changeType="positive"
                    subtitle="Success telemetry"
                />
                <StatCard
                    title="Last Request"
                    value={stats.last_request_at}
                    icon={Clock}
                    change={stats.failed_requests > 0 ? `${stats.failed_requests} errors` : "Zero errors"}
                    changeType={stats.failed_requests > 0 ? "negative" : "positive"}
                    subtitle="Latest invocation"
                />
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
{documentationSnippet}
                </pre>
            </div>

            {/* Rate Limits & Status */}
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={16} className="text-[#35877D]" />
                    Workspace Rate Limits & Guardrails
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard
                        title="Rate Limit"
                        value="1,000 / min"
                        icon={Zap}
                        change="STANDARD"
                        changeType="neutral"
                        subtitle="Workspace throttle limit"
                    />
                    <StatCard
                        title="Max Active Keys"
                        value="25 Keys"
                        icon={Key}
                        change="PROTECTED"
                        changeType="neutral"
                        subtitle="Credential quota"
                    />
                    <StatCard
                        title="Token Hashing"
                        value="SHA-256"
                        icon={Clock}
                        change="ENCRYPTED"
                        changeType="positive"
                        subtitle="Zero-plaintext stored"
                    />
                </div>
            </div>
        </div>
    );
}
