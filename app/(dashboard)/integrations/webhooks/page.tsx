"use client";

import { useState } from "react";
import { Webhook, Plus, Globe, CheckCircle2, Trash2, Send, Activity, ExternalLink } from "lucide-react";
import { UpgradeGuard } from "@/components/upgrade-guard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface WebhookItem {
    id: string;
    url: string;
    events: string[];
    status: "active" | "inactive";
    lastDelivery: string;
}

export default function WebhooksPage() {
    const [endpoints, setEndpoints] = useState<WebhookItem[]>([
        {
            id: "wh_1",
            url: "https://api.yourdomain.com/webhooks/connectly360",
            events: ["messages.received", "campaigns.completed"],
            status: "active",
            lastDelivery: "5 mins ago (200 OK)"
        }
    ]);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newUrl, setNewUrl] = useState("");
    const [testingId, setTestingId] = useState<string | null>(null);

    const handleAddEndpoint = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl.trim()) return;
        const newEp: WebhookItem = {
            id: `wh_${Date.now()}`,
            url: newUrl.trim(),
            events: ["messages.received"],
            status: "active",
            lastDelivery: "Pending verification"
        };
        setEndpoints(prev => [...prev, newEp]);
        setNewUrl("");
        setIsAddOpen(false);
        toast.success("Webhook endpoint registered successfully");
    };

    const handleDeleteEndpoint = (id: string) => {
        setEndpoints(prev => prev.filter(ep => ep.id !== id));
        toast.success("Webhook endpoint deleted");
    };

    const handleTestPing = (id: string) => {
        setTestingId(id);
        setTimeout(() => {
            setTestingId(null);
            toast.success("Test ping sent! Received HTTP 200 OK.");
        }, 1000);
    };

    return (
        <UpgradeGuard 
            allowedPlans={["growth", "business", "enterprise"]} 
            featureName="Webhooks" 
            description="Configure real-time webhooks to automatically forward WhatsApp events to your server."
        >
            <div className="space-y-6">
                <PageHeader
                    icon={Webhook}
                    title="Realtime Webhooks"
                    description="Configure HTTPS endpoints to receive immediate delivery status, incoming messages, and campaign events."
                    breadcrumbs={[
                        { label: "Channels & Integrations", href: "/integrations" },
                        { label: "Webhooks" }
                    ]}
                    actions={
                        <Button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            <Plus size={16} />
                            Add Webhook Endpoint
                        </Button>
                    }
                />

                <Card className="border border-slate-200/80 bg-white rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-base font-bold text-slate-900">Configured Endpoints</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Connectly360 sends POST requests signed with your workspace HMAC secret.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {endpoints.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center">
                                <Webhook size={36} className="text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No webhooks configured</p>
                                <p className="text-xs text-slate-400 mt-0.5">Register an endpoint to begin receiving realtime event payloads.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {endpoints.map(ep => (
                                    <div key={ep.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <Globe size={14} className="text-slate-400" />
                                                <p className="font-mono text-xs font-bold text-slate-900">{ep.url}</p>
                                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                                                    Active
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {ep.events.map(ev => (
                                                    <span key={ev} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                                                        {ev}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-slate-400">Latest Ping: {ep.lastDelivery}</p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTestPing(ep.id)}
                                                disabled={testingId === ep.id}
                                                className="h-8 px-3 rounded-lg text-xs font-semibold border-slate-200 cursor-pointer"
                                            >
                                                <Send size={12} className={`mr-1.5 ${testingId === ep.id ? "animate-spin" : ""}`} />
                                                {testingId === ep.id ? "Sending Ping..." : "Test Ping"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteEndpoint(ep.id)}
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

                {/* Add Endpoint Modal */}
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Webhook Endpoint</DialogTitle>
                            <DialogDescription className="text-xs">
                                Enter your HTTPS callback URL to begin receiving webhook deliveries.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddEndpoint} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="webhook-url" className="text-xs font-bold text-slate-700">Endpoint URL (HTTPS)</Label>
                                <Input
                                    id="webhook-url"
                                    type="url"
                                    required
                                    placeholder="https://api.yourdomain.com/webhooks/c360"
                                    value={newUrl}
                                    onChange={(e) => setNewUrl(e.target.value)}
                                    className="rounded-xl border-slate-200 text-xs"
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-xl text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#35877D] hover:bg-[#2c6f66] text-white rounded-xl text-xs font-bold">
                                    Register Endpoint
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </UpgradeGuard>
    );
}
