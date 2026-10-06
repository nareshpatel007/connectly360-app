"use client";

import { useState } from "react";
import { Key, Plus, Copy, Check, ShieldCheck, Eye, EyeOff, Trash2 } from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ApiKeyItem {
    id: string;
    name: string;
    keyMasked: string;
    rawKey: string;
    createdAt: string;
    lastUsed: string;
}

export default function APIKeysPage() {
    const [keys, setKeys] = useState<ApiKeyItem[]>([
        {
            id: "key_live_1",
            name: "Production REST Client",
            keyMasked: "c360_live_8f91••••••••••••••••••••",
            rawKey: "c360_live_8f91a2b0c3d4e5f67890abcdef123456",
            createdAt: "Oct 1, 2026",
            lastUsed: "12 mins ago"
        }
    ]);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("API Key copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleGenerateKey = () => {
        const newKey: ApiKeyItem = {
            id: `key_${Date.now()}`,
            name: `REST Token #${keys.length + 1}`,
            keyMasked: `c360_live_${Math.random().toString(36).substring(2, 6)}••••••••••••••••••••`,
            rawKey: `c360_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
            createdAt: "Just now",
            lastUsed: "Never"
        };
        setKeys(prev => [newKey, ...prev]);
        toast.success("New API key generated successfully");
    };

    const handleDeleteKey = (id: string) => {
        setKeys(prev => prev.filter(k => k.id !== id));
        toast.success("API key revoked");
    };

    return (
        <UpgradeGuard 
            allowedPlans={["business", "enterprise"]} 
            featureName="Developer API Access" 
            description="Integrate Connectly360 with your proprietary CRMs, websites, and databases using secure API access."
        >
            <div className="space-y-6">
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
                            onClick={handleGenerateKey}
                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={16} />
                            Generate New Key
                        </Button>
                    }
                />

                <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900">Active API Keys</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Keys carry full workspace authority. Keep them secret and never expose them in client-side code.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {keys.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <Key size={36} className="text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No API keys found</p>
                                <p className="text-xs text-slate-400 mt-0.5">Generate a key to begin using the Connectly360 REST API.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {keys.map(k => (
                                    <div key={k.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-900">{k.name}</p>
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                                    Active
                                                </Badge>
                                            </div>
                                            <p className="font-mono text-xs text-slate-500 tracking-wide">{k.keyMasked}</p>
                                            <div className="flex items-center gap-4 text-[11px] text-slate-400">
                                                <span>Created: {k.createdAt}</span>
                                                <span>•</span>
                                                <span>Last used: {k.lastUsed}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy(k.id, k.rawKey)}
                                                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 cursor-pointer"
                                            >
                                                {copiedId === k.id ? <Check size={13} className="text-emerald-600 mr-1.5" /> : <Copy size={13} className="mr-1.5 text-slate-500" />}
                                                {copiedId === k.id ? "Copied" : "Copy Key"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteKey(k.id)}
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </UpgradeGuard>
    );
}
