"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Key,
    Plus,
    Copy,
    Check,
    RotateCw,
    Ban,
    Eye,
    ShieldAlert,
    ShieldCheck,
    Terminal,
    Lock,
    Download,
    Search,
    Filter,
    Calendar,
    Globe,
    AlertTriangle,
    Info,
    RefreshCw,
    CheckCircle2,
    X,
    ExternalLink
} from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ApiKeyItem {
    id: number;
    name: string;
    environment: "live" | "test";
    status: "active" | "revoked" | "expired";
    key_prefix: string;
    key_masked: string;
    scopes: string[];
    last_used_at: string | null;
    last_used_human: string;
    last_used_ip: string | null;
    expires_at: string | null;
    created_at: string;
    created_at_human: string;
    created_by: { id: number; name: string } | null;
    revoked_at: string | null;
}

const SCOPE_GROUPS = [
    {
        name: "Messaging",
        items: [
            { key: "messages.read", label: "Read Messages", desc: "Access conversations and message logs" },
            { key: "messages.send", label: "Send Messages", desc: "Dispatch WhatsApp and chat messages" }
        ]
    },
    {
        name: "Contacts & Customers",
        items: [
            { key: "contacts.read", label: "Read Contacts", desc: "Query workspace contacts and attributes" },
            { key: "contacts.write", label: "Manage Contacts", desc: "Create, update, and import contacts" }
        ]
    },
    {
        name: "Leads Pipeline",
        items: [
            { key: "leads.read", label: "Read Leads", desc: "Inspect CRM lead stages and deals" },
            { key: "leads.write", label: "Manage Leads", desc: "Create and update lead status" }
        ]
    },
    {
        name: "Campaigns",
        items: [
            { key: "campaigns.read", label: "Read Campaigns", desc: "View broadcasts and performance" },
            { key: "campaigns.write", label: "Draft Campaigns", desc: "Create and configure broadcasts" },
            { key: "campaigns.send", label: "Trigger Campaigns", desc: "Execute automated bulk campaigns" }
        ]
    },
    {
        name: "Webhooks & Analytics",
        items: [
            { key: "webhooks.read", label: "Read Webhooks", desc: "View webhook endpoint settings" },
            { key: "webhooks.write", label: "Manage Webhooks", desc: "Configure callback subscriptions" },
            { key: "analytics.read", label: "Read Analytics", desc: "Access delivery metrics and reports" }
        ]
    }
];

export default function APIKeysPage() {
    // List state
    const [keys, setKeys] = useState<ApiKeyItem[]>([]);
    const [counts, setCounts] = useState({ total: 0, active: 0, revoked: 0, expired: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked" | "expired">("all");
    const [envFilter, setEnvFilter] = useState<"all" | "live" | "test">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSecretRevealOpen, setIsSecretRevealOpen] = useState(false);
    const [isRotateOpen, setIsRotateOpen] = useState(false);
    const [isRevokeOpen, setIsRevokeOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Selected key for actions
    const [selectedKey, setSelectedKey] = useState<ApiKeyItem | null>(null);

    // One-time secret state (strictly wiped once modal is closed)
    const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
    const [revealedKeyName, setRevealedKeyName] = useState<string>("");
    const [isSecretCopied, setIsSecretCopied] = useState(false);
    const [copiedPrefixId, setCopiedPrefixId] = useState<number | null>(null);

    // Form states
    const [formName, setFormName] = useState("");
    const [formEnv, setFormEnv] = useState<"live" | "test">("live");
    const [formExpiryDays, setFormExpiryDays] = useState<string>("never");
    const [formScopes, setFormScopes] = useState<string[]>(["messages.send", "contacts.read"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Rotate options
    const [rotateRevokeOld, setRotateRevokeOld] = useState(false);

    // Fetch keys from backend
    const fetchKeys = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setIsRefreshing(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (envFilter !== "all") params.append("environment", envFilter);
            if (searchQuery.trim()) params.append("search", searchQuery.trim());

            const res = await fetch(`/api/developer/api-keys?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
                setKeys(json.data || []);
                if (json.counts) setCounts(json.counts);
            } else {
                toast.error(json.message || "Unable to load API keys");
            }
        } catch {
            toast.error("Failed to fetch API keys");
        } finally {
            setIsLoading(false);
            if (showRefreshIndicator) setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchKeys();
    }, [statusFilter, envFilter]);

    // Handle Search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchKeys();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Copy handlers
    const handleCopySecret = () => {
        if (!oneTimeSecret) return;
        navigator.clipboard.writeText(oneTimeSecret);
        setIsSecretCopied(true);
        toast.success("API Key copied to clipboard");
        setTimeout(() => setIsSecretCopied(false), 2000);
    };

    const handleCopyPrefix = (key: ApiKeyItem) => {
        navigator.clipboard.writeText(key.key_prefix);
        setCopiedPrefixId(key.id);
        toast.success("Key prefix copied");
        setTimeout(() => setCopiedPrefixId(null), 2000);
    };

    const handleDownloadSecret = () => {
        if (!oneTimeSecret) return;
        const blob = new Blob([`# Connectly360 API Key\n# Name: ${revealedKeyName}\n# Generated: ${new Date().toISOString()}\n\n${oneTimeSecret}\n`], {
            type: "text/plain;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `connectly360-${revealedKeyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}-key.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("API key file downloaded");
    };

    // Close one-time reveal modal and wipe token
    const handleCloseRevealModal = () => {
        setIsSecretRevealOpen(false);
        setOneTimeSecret(null);
        setRevealedKeyName("");
        setIsSecretCopied(false);
    };

    // Generate Key Submit
    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) {
            toast.error("Please provide a name for this API key");
            return;
        }

        setIsSubmitting(true);
        try {
            const bodyData: any = {
                name: formName.trim(),
                environment: formEnv,
                scopes: formScopes,
            };

            if (formExpiryDays !== "never") {
                bodyData.expires_in_days = parseInt(formExpiryDays, 10);
            }

            const res = await fetch("/api/developer/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });

            const json = await res.json();
            if (json.success && json.data) {
                setIsCreateOpen(false);
                // Wipe form
                setFormName("");
                setFormEnv("live");
                setFormExpiryDays("never");
                setFormScopes(["messages.send", "contacts.read"]);

                // Set one-time reveal
                setOneTimeSecret(json.data.token);
                setRevealedKeyName(json.data.name);
                setIsSecretRevealOpen(true);

                toast.success("New API key generated successfully");
                fetchKeys();
            } else {
                toast.error(json.message || "Failed to generate API key");
            }
        } catch {
            toast.error("Network error while generating API key");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Revoke Key
    const handleConfirmRevoke = async () => {
        if (!selectedKey) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/developer/api-keys/${selectedKey.id}/revoke`, {
                method: "POST",
            });
            const json = await res.json();
            if (json.success) {
                toast.success(`API key '${selectedKey.name}' has been revoked`);
                setIsRevokeOpen(false);
                setSelectedKey(null);
                fetchKeys();
            } else {
                toast.error(json.message || "Failed to revoke key");
            }
        } catch {
            toast.error("Network error while revoking API key");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Rotate Key
    const handleConfirmRotate = async () => {
        if (!selectedKey) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/developer/api-keys/${selectedKey.id}/rotate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ revoke_old: rotateRevokeOld }),
            });
            const json = await res.json();
            if (json.success && json.data) {
                setIsRotateOpen(false);
                const oldName = selectedKey.name;
                setSelectedKey(null);

                // Set one-time reveal
                setOneTimeSecret(json.data.token);
                setRevealedKeyName(`${oldName} (Replacement)`);
                setIsSecretRevealOpen(true);

                toast.success("Replacement API key generated");
                fetchKeys();
            } else {
                toast.error(json.message || "Failed to rotate API key");
            }
        } catch {
            toast.error("Network error during key rotation");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Scope selection helpers
    const toggleScope = (scopeKey: string) => {
        setFormScopes(prev =>
            prev.includes(scopeKey) ? prev.filter(s => s !== scopeKey) : [...prev, scopeKey]
        );
    };

    const handleSelectAllScopes = () => {
        const all = SCOPE_GROUPS.flatMap(g => g.items.map(i => i.key));
        if (formScopes.length === all.length) {
            setFormScopes(["messages.send", "contacts.read"]);
        } else {
            setFormScopes(all);
        }
    };

    return (
        <UpgradeGuard
            allowedPlans={["business", "enterprise"]}
            featureName="Developer API Access"
            description="Integrate Connectly360 with your proprietary CRMs, websites, and databases using secure API access."
        >
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    icon={Key}
                    title="API Keys & Access Tokens"
                    description="Generate secure Bearer tokens for programmatically sending messages and querying workspace contacts."
                    breadcrumbs={[
                        { label: "Channels & Integrations", href: "/integrations" },
                        { label: "API Keys" }
                    ]}
                    actions={
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer font-semibold text-xs h-10 px-4"
                        >
                            <Plus size={16} />
                            Generate New Key
                        </Button>
                    }
                />

                {/* Security Advice Notice Banner */}
                <div className="bg-teal-50/60 border border-teal-200/60 rounded-2xl p-4 flex items-start gap-3 text-slate-700">
                    <ShieldCheck className="text-[#35877D] shrink-0 mt-0.5" size={18} />
                    <div className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-900">Zero-Plaintext Security Architecture</p>
                        <p className="text-slate-600 leading-relaxed">
                            API keys carry workspace authority and are hashed via SHA-256 upon generation. Plaintext secrets are revealed strictly once and cannot be recovered later. Never commit credentials to public code repositories or client-side bundles.
                        </p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Tabs */}
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                All ({counts.total})
                            </button>
                            <button
                                onClick={() => setStatusFilter("active")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    statusFilter === "active" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                Active ({counts.active})
                            </button>
                            <button
                                onClick={() => setStatusFilter("revoked")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    statusFilter === "revoked" ? "bg-white text-rose-700 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                Revoked ({counts.revoked})
                            </button>
                            <button
                                onClick={() => setStatusFilter("expired")}
                                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    statusFilter === "expired" ? "bg-white text-amber-700 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                Expired ({counts.expired})
                            </button>
                        </div>

                        {/* Environment Selector */}
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
                            <button
                                onClick={() => setEnvFilter("all")}
                                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    envFilter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                All Envs
                            </button>
                            <button
                                onClick={() => setEnvFilter("live")}
                                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    envFilter === "live" ? "bg-white text-[#35877D] shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                Live
                            </button>
                            <button
                                onClick={() => setEnvFilter("test")}
                                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    envFilter === "test" ? "bg-white text-amber-700 shadow-2xs font-bold" : "hover:text-slate-900"
                                }`}
                            >
                                Test
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or prefix..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#35877D]"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchKeys(true)}
                            className="h-8 px-2.5 border-slate-200 rounded-xl text-slate-600 cursor-pointer"
                            title="Refresh Keys"
                        >
                            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[#35877D]" : ""} />
                        </Button>
                    </div>
                </div>

                {/* Primary Keys Card */}
                <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900">Active API Keys</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Keys carry full workspace authority. Keep them secret and never expose them in client-side code.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="divide-y divide-slate-100 p-4 space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between pt-2">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40 rounded-md" />
                                            <Skeleton className="h-3 w-56 rounded-md" />
                                            <Skeleton className="h-3 w-32 rounded-md" />
                                        </div>
                                        <Skeleton className="h-8 w-28 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : keys.length === 0 ? (
                            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                                <div className="h-14 w-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-3">
                                    <Key size={26} className="text-[#35877D]" />
                                </div>
                                <p className="text-sm font-bold text-slate-900">No API keys found</p>
                                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                                    {searchQuery || statusFilter !== "all" || envFilter !== "all"
                                        ? "No keys match the selected filters. Try resetting search criteria."
                                        : "Generate an API key to begin programmatically connecting your apps, CRMs, and webhooks to Connectly360."}
                                </p>
                                {statusFilter === "all" && !searchQuery && (
                                    <Button
                                        onClick={() => setIsCreateOpen(true)}
                                        className="mt-4 bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-semibold cursor-pointer h-9 px-4"
                                    >
                                        <Plus size={14} className="mr-1.5" />
                                        Generate New Key
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {keys.map((k) => (
                                    <div
                                        key={k.id}
                                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-xs font-bold text-slate-900">{k.name}</p>

                                                {/* Environment Badge */}
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md ${
                                                        k.environment === "live"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}
                                                >
                                                    {k.environment}
                                                </Badge>

                                                {/* Status Badge */}
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                        k.status === "active"
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : k.status === "revoked"
                                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                                            : "bg-slate-100 text-slate-600 border-slate-300"
                                                    }`}
                                                >
                                                    {k.status.charAt(0).toUpperCase() + k.status.slice(1)}
                                                </Badge>

                                                {/* Expiration tag if set */}
                                                {k.expires_at && (
                                                    <span className="text-[10px] text-slate-400">
                                                        Expires: {new Date(k.expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Masked Prefix Display */}
                                            <div className="flex items-center gap-2">
                                                <p className="font-mono text-xs text-slate-600 tracking-wider font-semibold">
                                                    {k.key_masked}
                                                </p>
                                                <button
                                                    onClick={() => handleCopyPrefix(k)}
                                                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                                    title="Copy key prefix"
                                                >
                                                    {copiedPrefixId === k.id ? (
                                                        <span className="text-emerald-600 font-sans font-semibold">Copied</span>
                                                    ) : (
                                                        <Copy size={11} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Metadata row */}
                                            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                                                <span>Created: {k.created_at_human}</span>
                                                <span>•</span>
                                                <span className={k.last_used_human !== "Never" ? "text-slate-600 font-medium" : ""}>
                                                    Last used: {k.last_used_human}
                                                </span>
                                                {k.scopes && k.scopes.length > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-slate-500">
                                                            {k.scopes.length} {k.scopes.length === 1 ? "scope" : "scopes"}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                            {/* Details Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedKey(k);
                                                    setIsDetailsOpen(true);
                                                }}
                                                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer"
                                            >
                                                <Eye size={13} className="mr-1.5 text-slate-400" />
                                                Details
                                            </Button>

                                            {/* Rotate Button (Only for active keys) */}
                                            {k.status === "active" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedKey(k);
                                                        setRotateRevokeOld(false);
                                                        setIsRotateOpen(true);
                                                    }}
                                                    className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 text-slate-700 hover:text-[#35877D] hover:border-[#35877D] cursor-pointer"
                                                >
                                                    <RotateCw size={13} className="mr-1.5 text-slate-400" />
                                                    Rotate
                                                </Button>
                                            )}

                                            {/* Revoke Button (Semantic revocation, non-destructive to history) */}
                                            {k.status === "active" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedKey(k);
                                                        setIsRevokeOpen(true);
                                                    }}
                                                    className="h-8 px-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer text-xs font-semibold"
                                                    title="Revoke key"
                                                >
                                                    <Ban size={14} className="mr-1" />
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 1. Generate Key Modal */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent className="sm:max-w-xl rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Key className="text-[#35877D]" size={18} />
                                Generate New API Key
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Configure credentials, environment isolation, and granular permission scopes.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateKey} className="space-y-4 pt-2">
                            {/* Key Name */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-800">
                                    Key Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Production REST API, Zapier Sync, Mobile App"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#35877D] focus:bg-white"
                                />
                            </div>

                            {/* Environment & Expiry Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">Environment</label>
                                    <select
                                        value={formEnv}
                                        onChange={(e) => setFormEnv(e.target.value as "live" | "test")}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#35877D] focus:bg-white cursor-pointer"
                                    >
                                        <option value="live">Live / Production (c360_live_)</option>
                                        <option value="test">Test / Sandbox (c360_test_)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">Expiration</label>
                                    <select
                                        value={formExpiryDays}
                                        onChange={(e) => setFormExpiryDays(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#35877D] focus:bg-white cursor-pointer"
                                    >
                                        <option value="never">Never expires</option>
                                        <option value="30">30 days</option>
                                        <option value="90">90 days</option>
                                        <option value="365">1 year (Recommended)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Scopes Section */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800">
                                        API Scopes & Permissions
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllScopes}
                                        className="text-[11px] font-semibold text-[#35877D] hover:underline cursor-pointer"
                                    >
                                        Toggle All
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                    {SCOPE_GROUPS.map((group) => (
                                        <div key={group.name} className="space-y-1.5">
                                            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                                {group.name}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {group.items.map((item) => {
                                                    const isSelected = formScopes.includes(item.key);
                                                    return (
                                                        <label
                                                            key={item.key}
                                                            className={`p-2 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? "border-[#35877D] bg-teal-50/40 text-slate-900"
                                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleScope(item.key)}
                                                                className="mt-0.5 rounded text-[#35877D] focus:ring-[#35877D] cursor-pointer"
                                                            />
                                                            <div className="text-[11px] leading-tight">
                                                                <p className="font-bold">{item.label}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.key}</p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <DialogFooter className="pt-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl text-xs font-semibold border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-semibold"
                                >
                                    {isSubmitting ? "Generating..." : "Generate API Key"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* 2. One-Time Secret Reveal Modal */}
                <Dialog open={isSecretRevealOpen} onOpenChange={(open) => {
                    if (!open) handleCloseRevealModal();
                }}>
                    <DialogContent className="sm:max-w-lg rounded-2xl bg-white p-6">
                        <DialogHeader>
                            <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-2">
                                <ShieldCheck className="text-[#35877D]" size={22} />
                            </div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                API Key Created
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Credentials for &apos;{revealedKeyName}&apos; have been generated securely.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Critical Security Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">This secret will only be shown once.</p>
                                    <p className="text-amber-700 mt-0.5">
                                        Store this key securely right now. It is hashed in the database and cannot be retrieved again after closing.
                                    </p>
                                </div>
                            </div>

                            {/* Raw Secret Box */}
                            <div className="bg-slate-900 rounded-xl p-3.5 space-y-2 text-white">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                    <span>Bearer Token</span>
                                    <span className="text-emerald-400 font-sans font-semibold text-[10px]">Active</span>
                                </div>
                                <div className="font-mono text-xs text-emerald-400 break-all select-all font-semibold p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                                    {oneTimeSecret}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleCopySecret}
                                    className="flex-1 bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-semibold h-9"
                                >
                                    {isSecretCopied ? (
                                        <>
                                            <Check size={14} className="mr-1.5" />
                                            Copied to Clipboard
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={14} className="mr-1.5" />
                                            Copy Key
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadSecret}
                                    className="rounded-xl border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold h-9"
                                >
                                    <Download size={14} className="mr-1.5 text-slate-500" />
                                    Download .txt
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-100">
                            <Button
                                onClick={handleCloseRevealModal}
                                variant="outline"
                                className="w-full rounded-xl text-xs font-semibold border-slate-200"
                            >
                                I have stored this key securely
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 3. Rotate Key Modal */}
                <Dialog open={isRotateOpen} onOpenChange={setIsRotateOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <RotateCw className="text-[#35877D]" size={18} />
                                Rotate API Key
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Safely rotate credentials for &apos;{selectedKey?.name}&apos;.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2 text-xs text-slate-600">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                <p className="font-bold text-slate-900">Zero-Downtime Safe Rotation</p>
                                <p className="text-slate-500 leading-relaxed">
                                    A replacement key will be created with the same permissions. The existing key remains active until you test and confirm the replacement.
                                </p>
                            </div>

                            <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rotateRevokeOld}
                                    onChange={(e) => setRotateRevokeOld(e.target.checked)}
                                    className="rounded text-[#35877D] focus:ring-[#35877D] cursor-pointer"
                                />
                                <span className="font-semibold text-slate-800">
                                    Revoke current key immediately (causes downtime if in use)
                                </span>
                            </label>
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-100">
                            <Button
                                variant="outline"
                                onClick={() => setIsRotateOpen(false)}
                                className="rounded-xl text-xs font-semibold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmRotate}
                                disabled={isSubmitting}
                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-semibold"
                            >
                                {isSubmitting ? "Rotating..." : "Generate Replacement"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 4. Revoke Key Confirmation Modal */}
                <Dialog open={isRevokeOpen} onOpenChange={setIsRevokeOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6">
                        <DialogHeader>
                            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-2">
                                <Ban className="text-rose-600" size={20} />
                            </div>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Revoke API Key?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                This will immediately stop all API requests using &apos;{selectedKey?.name}&apos;.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl text-xs text-rose-800 leading-relaxed">
                            Any server, script, or integration authenticating with prefix <code className="font-mono font-bold">{selectedKey?.key_prefix}</code> will immediately receive a <strong>401 Unauthorized</strong> response. This state transition is irreversible.
                        </div>

                        <DialogFooter className="pt-3 border-t border-slate-100">
                            <Button
                                variant="outline"
                                onClick={() => setIsRevokeOpen(false)}
                                className="rounded-xl text-xs font-semibold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmRevoke}
                                disabled={isSubmitting}
                                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                            >
                                {isSubmitting ? "Revoking..." : "Revoke Key"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* 5. Key Details Modal */}
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Info className="text-[#35877D]" size={18} />
                                API Key Security Details
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500">
                                Metadata and telemetry for &apos;{selectedKey?.name}&apos;.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedKey && (
                            <div className="space-y-3 py-2 text-xs divide-y divide-slate-100">
                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-medium">Status</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-semibold ${
                                            selectedKey.status === "active"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : "bg-rose-50 text-rose-700 border-rose-200"
                                        }`}
                                    >
                                        {selectedKey.status.toUpperCase()}
                                    </Badge>
                                </div>

                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-medium">Environment</span>
                                    <span className="font-bold uppercase text-slate-700">{selectedKey.environment}</span>
                                </div>

                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-medium">Key Prefix</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedKey.key_prefix}</span>
                                </div>

                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-medium">Created</span>
                                    <span className="text-slate-700">{selectedKey.created_at_human}</span>
                                </div>

                                <div className="flex justify-between py-1.5">
                                    <span className="text-slate-400 font-medium">Last Used</span>
                                    <span className="text-slate-700 font-medium">{selectedKey.last_used_human}</span>
                                </div>

                                {selectedKey.last_used_ip && (
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-slate-400 font-medium">Last Used From</span>
                                        <span className="font-mono text-slate-700">{selectedKey.last_used_ip}</span>
                                    </div>
                                )}

                                <div className="py-2 space-y-1.5">
                                    <span className="text-slate-400 font-medium block">Authorized Scopes</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedKey.scopes && selectedKey.scopes.length > 0 ? (
                                            selectedKey.scopes.map((s) => (
                                                <Badge
                                                    key={s}
                                                    variant="secondary"
                                                    className="text-[10px] font-mono bg-slate-100 text-slate-700"
                                                >
                                                    {s}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-slate-400">No specific scopes</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-3 border-t border-slate-100">
                            <Button
                                onClick={() => setIsDetailsOpen(false)}
                                variant="outline"
                                className="w-full rounded-xl text-xs font-semibold border-slate-200"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </UpgradeGuard>
    );
}
