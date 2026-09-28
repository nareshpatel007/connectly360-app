"use client";

import { useState, useEffect, useCallback } from "react";
import {
    useGetWhatsappStatus,
    useExchangeMetaToken,
    useDisconnectWhatsapp,
    getGetWhatsappStatusQueryKey,
    useListAutomations,
    useCreateAutomation,
    useDeleteAutomation,
    useUpdateAutomation
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Wifi,
    WifiOff,
    RefreshCcw,
    PhoneCall,
    Building2,
    Hash,
    Plus,
    Trash2,
    Loader2,
    Zap,
    HelpCircle,
    AlertCircle,
    ArrowUpRight,
    Send,
    Activity,
    ShieldCheck,
    Key
} from "lucide-react";

declare global {
    interface Window {
        FB?: {
            init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void;
            login: (
                callback: (response: { authResponse?: { code?: string }; status?: string }) => void,
                params: {
                    config_id: string;
                    response_type: string;
                    override_default_response_type: boolean;
                    extras?: Record<string, unknown>;
                }
            ) => void;
        };
    }
}

const STATUS_CONFIG = {
    connected: { label: "Connected", icon: CheckCircle2, color: "text-[#35877D]", badge: "bg-emerald-50 text-[#35877D] border-emerald-100" },
    pending: { label: "Pending", icon: Clock, color: "text-amber-600", badge: "bg-amber-50 text-amber-800 border-amber-100" },
    failed: { label: "Failed", icon: XCircle, color: "text-red-600", badge: "bg-red-50 text-red-800 border-red-100" },
    disconnected: { label: "Disconnected", icon: WifiOff, color: "text-slate-400", badge: "bg-slate-50 text-slate-500 border-slate-200" },
};

function useMetaConfig() {
    return useQuery<{ appId: string | null; configId: string | null; verifyToken: string | null }>({
        queryKey: ["metaConfig"],
        queryFn: async () => {
            const res = await fetch("/api/meta/config");
            return res.json();
        },
        staleTime: Infinity,
    });
}

function useFacebookSdk(appId: string | null | undefined) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !appId) return;
        if (window.FB) { setLoaded(true); return; }

        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.FB?.init({ appId, cookie: true, xfbml: true, version: "v23.0" });
            setLoaded(true);
        };
        document.body.appendChild(script);
    }, [appId]);

    return loaded;
}

export default function WhatsAppIntegrationPage() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [activeTab, setActiveTab] = useState("settings");

    // Test message dialog state
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testBody, setTestBody] = useState("Hello from Connectly360! This is a test WhatsApp message.");
    const [isSendingTest, setIsSendingTest] = useState(false);

    // Manual authorization code dialog state
    const [manualCodeOpen, setManualCodeOpen] = useState(false);
    const [manualCodeInput, setManualCodeInput] = useState("");

    // Form inputs for creating automation rule
    const [ruleName, setRuleName] = useState("");
    const [ruleKeyword, setRuleKeyword] = useState("");
    const [ruleReply, setRuleReply] = useState("");

    const { data: metaConfig, isLoading: isLoadingConfig } = useMetaConfig();
    const sdkLoaded = useFacebookSdk(metaConfig?.appId);

    const { data: account, isLoading: isLoadingStatus } = useGetWhatsappStatus({
        query: { queryKey: getGetWhatsappStatusQueryKey() },
    });
    const { data: automations, isLoading: isLoadingAutomations, refetch: refetchAutomations } = useListAutomations();

    const exchangeToken = useExchangeMetaToken();
    const disconnect = useDisconnectWhatsapp();
    const createAutomation = useCreateAutomation();
    const deleteAutomation = useDeleteAutomation();
    const updateAutomation = useUpdateAutomation();

    const refreshStatus = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
        refetchAutomations();
        toast({ title: "Refreshed", description: "Integration status and rules reloaded." });
    }, [queryClient, refetchAutomations, toast]);

    const handleSyncAccount = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch("/api/whatsapp/sync", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Account Synchronized", description: "WhatsApp WABA metrics updated successfully." });
                queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
            } else {
                toast({ title: "Sync Failed", description: data.message || "Failed to sync metrics.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Sync Error", description: String(e), variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const res = await fetch("/api/whatsapp/test-connection", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Connection Healthy", description: data.message || "WhatsApp Cloud API connection is active." });
                queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
            } else {
                toast({ title: "Connection Warning", description: data.message || "Health check returned warning.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Connection Error", description: String(e), variant: "destructive" });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSendTestMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone.trim() || !testBody.trim()) {
            toast({ title: "Validation Error", description: "Recipient phone and message body are required.", variant: "destructive" });
            return;
        }

        setIsSendingTest(true);
        try {
            const res = await fetch("/api/whatsapp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: testPhone.trim(),
                    body: testBody.trim(),
                    type: "text",
                    source: "test"
                })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Message Sent!", description: `Test message dispatched to ${testPhone}.` });
                setTestDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
            } else {
                toast({ title: "Send Failed", description: data.message || "Could not send message.", variant: "destructive" });
            }
        } catch (e: any) {
            toast({ title: "Send Error", description: String(e), variant: "destructive" });
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleExchangeCode = useCallback((code: string) => {
        const redirectUri = typeof window !== "undefined"
            ? (window.location.origin + window.location.pathname)
            : "https://connectly360.sandboxtechnology.in/integrations/whatsapp";

        setIsConnecting(true);
        exchangeToken.mutate(
            {
                data: {
                    code,
                    redirect_uri: redirectUri,
                },
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
                    toast({ title: "WhatsApp connected", description: "Your WhatsApp Business account has been connected successfully." });
                    setIsConnecting(false);
                    if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                },
                onError: (err: any) => {
                    toast({ title: "Connection failed", description: String(err?.message || err), variant: "destructive" });
                    setIsConnecting(false);
                    if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                },
            }
        );
    }, [exchangeToken, queryClient, toast]);

    // Auto-process code parameter from Meta OAuth redirect callback
    useEffect(() => {
        if (typeof window === "undefined") return;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
            handleExchangeCode(code);
        }
    }, [handleExchangeCode]);

    function launchEmbeddedSignup() {
        if (!metaConfig?.appId || !metaConfig?.configId) {
            toast({
                title: "Configuration missing",
                description: "META_APP_ID and META_CONFIG_ID are not set in server environment.",
                variant: "destructive",
            });
            return;
        }

        const redirectUri = typeof window !== "undefined"
            ? (window.location.origin + window.location.pathname)
            : "https://connectly360.sandboxtechnology.in/integrations/whatsapp";

        const oauthUrl = `https://www.facebook.com/v23.0/dialog/oauth?client_id=${metaConfig.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${metaConfig.configId}&response_type=code&override_default_response_type=true`;

        const isHttp = typeof window !== "undefined" && window.location.protocol === "http:";

        if (isHttp) {
            setIsConnecting(true);
            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                oauthUrl,
                "MetaWhatsAppAuth",
                `toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width=${width},height=${height},top=${top},left=${left}`
            );

            if (!popup) {
                toast({
                    title: "Popup Blocked",
                    description: "Please allow popups for this site or use 'Enter OAuth Code'.",
                    variant: "destructive",
                });
                setIsConnecting(false);
                return;
            }

            const pollTimer = setInterval(() => {
                try {
                    if (!popup || popup.closed) {
                        clearInterval(pollTimer);
                        setIsConnecting(false);
                        return;
                    }
                    if (popup.location.href && popup.location.href.includes("code=")) {
                        const urlParams = new URLSearchParams(popup.location.search);
                        const code = urlParams.get("code");
                        if (code) {
                            clearInterval(pollTimer);
                            popup.close();
                            handleExchangeCode(code);
                        }
                    }
                } catch (e) {
                    // Ignore cross-origin exceptions while popup is on facebook.com
                }
            }, 500);

            return;
        }

        if (!window.FB) {
            toast({
                title: "SDK initializing...",
                description: "Facebook SDK is still loading. Please wait a moment and click again.",
                variant: "destructive",
            });
            return;
        }

        setIsConnecting(true);

        try {
            window.FB.login(
                (response) => {
                    if (response.authResponse?.code) {
                        handleExchangeCode(response.authResponse.code);
                    } else {
                        toast({ title: "Signup cancelled", description: "WhatsApp connection was not completed.", variant: "destructive" });
                        setIsConnecting(false);
                    }
                },
                {
                    config_id: metaConfig.configId,
                    response_type: "code",
                    override_default_response_type: true,
                    extras: { setup: {}, featureType: "", sessionInfoVersion: "3" },
                }
            );
        } catch (err: any) {
            console.error("FB.login popover failed:", err);
            toast({
                title: "Meta Popup Error",
                description: "Could not launch Meta login popover. You can use 'Enter OAuth Code' to manually paste your code.",
                variant: "destructive",
            });
            setIsConnecting(false);
        }
    }

    const handleManualCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCodeInput.trim()) return;
        const redirectUri = typeof window !== "undefined" ? (window.location.origin + window.location.pathname) : "";
        setIsConnecting(true);
        exchangeToken.mutate(
            {
                data: {
                    code: manualCodeInput.trim(),
                    redirect_uri: redirectUri,
                },
            },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
                    toast({ title: "WhatsApp connected", description: "Your WhatsApp Business account has been connected successfully." });
                    setIsConnecting(false);
                    setManualCodeOpen(false);
                    setManualCodeInput("");
                },
                onError: (err: any) => {
                    toast({ title: "Connection failed", description: String(err?.message || err), variant: "destructive" });
                    setIsConnecting(false);
                },
            }
        );
    };

    function handleDisconnect() {
        disconnect.mutate(undefined, {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
                toast({ title: "Disconnected", description: "WhatsApp account has been disconnected." });
            },
        });
    }

    function handleCreateRule(e: React.FormEvent) {
        e.preventDefault();
        if (!ruleKeyword.trim() || !ruleReply.trim()) {
            toast({ title: "Validation Error", description: "Please specify both trigger keyword and reply message.", variant: "destructive" });
            return;
        }

        createAutomation.mutate(
            {
                data: {
                    name: ruleName.trim() || `${ruleKeyword.trim()} Auto-reply`,
                    keyword: ruleKeyword.trim(),
                    reply: ruleReply.trim(),
                    trigger_type: "New WhatsApp message is received",
                    action_type: "Send message",
                    status: true
                }
            },
            {
                onSuccess: () => {
                    toast({ title: "Rule Created", description: "Auto-reply automation added successfully." });
                    setRuleName("");
                    setRuleKeyword("");
                    setRuleReply("");
                    refetchAutomations();
                },
                onError: (err) => {
                    toast({ title: "Creation Failed", description: String(err), variant: "destructive" });
                }
            }
        );
    }

    function handleDeleteRule(id: number) {
        deleteAutomation.mutate(
            { id },
            {
                onSuccess: () => {
                    toast({ title: "Rule Deleted", description: "Automation rule removed successfully." });
                    refetchAutomations();
                },
                onError: (err) => {
                    toast({ title: "Deletion Failed", description: String(err), variant: "destructive" });
                }
            }
        );
    }

    function handleToggleStatus(id: number, currentStatus: number | boolean) {
        const nextStatus = (currentStatus === 1 || currentStatus === true) ? 0 : 1;
        updateAutomation.mutate(
            {
                id,
                data: { status: nextStatus }
            },
            {
                onSuccess: () => {
                    toast({ title: "Status Updated", description: `Rule status updated successfully.` });
                    refetchAutomations();
                },
                onError: (err) => {
                    toast({ title: "Update Failed", description: String(err), variant: "destructive" });
                }
            }
        );
    }

    const statusKey = (account?.status ?? "disconnected") as keyof typeof STATUS_CONFIG;
    const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.disconnected;
    const StatusIcon = statusCfg.icon;
    const isConnected = account?.status === "connected";
    const configReady = !!metaConfig?.appId && !!metaConfig?.configId;

    return (
        <div className="space-y-6 w-full">
            {/* Top Header Greetings */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 pb-2 border-b border-[#EAE6DF]/60">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2E1E]">WhatsApp Integration</h1>
                    <p className="text-xs text-slate-500 mt-1">Connect your WhatsApp Business API and configure automated auto-replies for incoming conversations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshStatus}
                        className="border-[#EAE6DF] hover:bg-slate-100/80 rounded-xl flex items-center gap-2 text-xs font-semibold cursor-pointer h-9 px-4"
                    >
                        <RefreshCcw size={13} className={isLoadingStatus ? "animate-spin text-[#35877D]" : "text-slate-500"} />
                        Refresh Status
                    </Button>

                    {isConnected && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-[#35877D] text-xs font-medium border border-emerald-100 shadow-xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35877D] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35877D]"></span>
                            </span>
                            Active
                        </span>
                    )}
                </div>
            </div>

            {/* Test Mode Banner */}
            {(account as any)?.is_test_mode && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900 shadow-xs">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-amber-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg shadow-xs shrink-0">
                            {(account as any)?.modeBadge || "TEST MODE"}
                        </span>
                        <p className="text-xs font-medium">
                            {(account as any)?.bannerMessage || "WhatsApp messages are simulated and will not be delivered to real customers."}
                        </p>
                    </div>
                </div>
            )}

            {/* Radix Tabs Wrapper */}
            <Tabs defaultValue="settings" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/80 p-1 rounded-xl mb-6 flex w-fit gap-1 border border-slate-200/50">
                    <TabsTrigger
                        value="settings"
                        className="rounded-lg text-xs font-medium px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#35877D] data-[state=active]:shadow-xs text-slate-600 hover:text-[#35877D]"
                    >
                        Connection &amp; Webhooks
                    </TabsTrigger>
                    <TabsTrigger
                        value="rules"
                        className="rounded-lg text-xs font-medium px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-white data-[state=active]:text-[#35877D] data-[state=active]:shadow-xs text-slate-600 hover:text-[#35877D]"
                    >
                        Auto-Reply Rules
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: CONNECTION & WEBHOOKS */}
                <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid gap-6 lg:grid-cols-12 items-start">

                        {/* Left Side: status card */}
                        <div className="lg:col-span-7 space-y-6">

                            {/* Connection Status Card */}
                            <Card className="bg-white border border-[#EAE6DF] shadow-[0_2px_8px_-2px_rgba(10,30,10,0.04)] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#FAF8F5] pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                                {isConnected ? (
                                                    <Wifi className="text-[#35877D]" size={18} />
                                                ) : (
                                                    <WifiOff className="text-slate-400" size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold text-[#0B2E1E]">Embedded Connection Status</CardTitle>
                                                <CardDescription className="text-xs text-slate-400">Manage Meta Business credentials mapping.</CardDescription>
                                            </div>
                                        </div>
                                        {isConnected && (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleSyncAccount}
                                                    disabled={isSyncing}
                                                    className="h-8 text-[11px] font-semibold rounded-lg border-slate-200"
                                                >
                                                    <RefreshCcw size={12} className={isSyncing ? "animate-spin mr-1" : "mr-1"} />
                                                    Sync
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleTestConnection}
                                                    disabled={isTesting}
                                                    className="h-8 text-[11px] font-semibold rounded-lg border-slate-200"
                                                >
                                                    <Activity size={12} className={isTesting ? "animate-spin mr-1" : "mr-1"} />
                                                    Test Health
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    {isLoadingStatus ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-8 w-36 rounded-lg" />
                                            <Skeleton className="h-5 w-full rounded-lg" />
                                            <Skeleton className="h-5 w-4/5 rounded-lg" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <StatusIcon size={18} className={statusCfg.color} />
                                                <Badge className={`text-xs font-medium px-3 py-1 border rounded-lg shadow-xs uppercase tracking-wider ${statusCfg.badge}`}>
                                                    {statusCfg.label}
                                                </Badge>
                                            </div>

                                            {account && account.status !== "disconnected" ? (
                                                <div className="border border-[#FAF8F5] rounded-xl p-1 bg-[#FAF8F5]/30 divide-y divide-[#FAF8F5]">
                                                    {account.displayName && <InfoRow icon={Building2} label="Business Name" value={account.displayName} />}
                                                    {account.phoneNumber && <InfoRow icon={PhoneCall} label="Phone Number" value={account.phoneNumber} />}
                                                    {account.wabaId && <InfoRow icon={Hash} label="WABA ID" value={account.wabaId} />}
                                                    {(account as any).qualityRating && (
                                                        <InfoRow icon={ShieldCheck} label="Quality Rating" value={(account as any).qualityRating} />
                                                    )}
                                                    {(account as any).messagingLimit && (
                                                        <InfoRow icon={Zap} label="Messaging Limit" value={(account as any).messagingLimit} />
                                                    )}
                                                    {account.connectedAt && (
                                                        <InfoRow icon={CheckCircle2} label="Connected On" value={new Date(account.connectedAt).toLocaleString("en-IN")} />
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 leading-relaxed bg-[#FAF8F5] p-4 rounded-xl border border-[#EAE6DF]/60">
                                                    No active WhatsApp Business API account connected yet. Use the embedded Meta onboarding below to securely link your WhatsApp account.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Embed Sign Up Trigger Action */}
                            <Card className="bg-white border border-[#EAE6DF] shadow-[0_2px_8px_-2px_rgba(10,30,10,0.04)] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#FAF8F5] pb-4">
                                    <CardTitle className="text-sm font-bold text-[#0B2E1E]">Onboard / Disconnect Portal</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Start onboard wizard using the Meta login SDK popover configuration.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {!isLoadingConfig && !configReady && (
                                        <div className="rounded-xl border border-amber-200 bg-[#FFFDF9] p-4 text-xs text-amber-800 flex gap-3">
                                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <strong className="font-bold text-[#785110]">Meta SDK Configuration Required:</strong>
                                                <p className="text-[#694B1B] mt-1 leading-relaxed">
                                                    The system cannot find <code className="font-mono bg-[#FAF1D6] px-1.5 py-0.5 rounded text-[11.5px]">META_APP_ID</code> and <code className="font-mono bg-[#FAF1D6] px-1.5 py-0.5 rounded text-[11.5px]">META_CONFIG_ID</code> in environment setups. Please make sure variables are configured to launch Meta signup.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            onClick={launchEmbeddedSignup}
                                            disabled={isConnecting || exchangeToken.isPending || !configReady || isLoadingConfig}
                                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer border-0"
                                        >
                                            {isConnecting || exchangeToken.isPending ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={14} />
                                                    Connecting Facebook...
                                                </>
                                            ) : isConnected ? (
                                                <>
                                                    <Wifi size={14} />
                                                    Reconnect Account
                                                </>
                                            ) : (
                                                <>
                                                    <Wifi size={14} />
                                                    Connect WhatsApp Business
                                                </>
                                            )}
                                        </Button>

                                        <Dialog open={manualCodeOpen} onOpenChange={setManualCodeOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs h-10 px-4 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    <Key size={14} />
                                                    Enter OAuth Code
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="text-base font-bold text-[#0B2E1E]">Manual Authorization Code</DialogTitle>
                                                    <DialogDescription className="text-xs text-slate-500">
                                                        Paste an authorization code obtained from Meta Embedded Signup to link your WABA account.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form onSubmit={handleManualCodeSubmit} className="space-y-4 pt-2">
                                                    <div>
                                                        <Label className="text-xs text-slate-600 mb-1 block font-semibold">Meta Authorization Code</Label>
                                                        <Input
                                                            value={manualCodeInput}
                                                            onChange={(e) => setManualCodeInput(e.target.value)}
                                                            placeholder="AQD..."
                                                            className="h-10 text-xs font-mono"
                                                            required
                                                        />
                                                    </div>
                                                    <DialogFooter className="gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => setManualCodeOpen(false)}
                                                            className="text-xs h-9"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={exchangeToken.isPending || !manualCodeInput.trim()}
                                                            className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs h-9 px-4 rounded-lg cursor-pointer"
                                                        >
                                                            {exchangeToken.isPending ? "Exchanging..." : "Exchange & Connect"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        {isConnected && (
                                            <>
                                                <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="border-[#35877D]/30 text-[#35877D] hover:bg-[#35877D]/5 text-xs h-10 px-4 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Send size={14} />
                                                            Send Test Message
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-base font-bold text-[#0B2E1E]">Send Test WhatsApp Message</DialogTitle>
                                                            <DialogDescription className="text-xs text-slate-500">
                                                                Test your Meta Cloud API connection by sending a real WhatsApp message to a phone number.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handleSendTestMessage} className="space-y-4 py-2">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-slate-700">Recipient Phone Number</Label>
                                                                <Input
                                                                    placeholder="e.g. +919876543210"
                                                                    value={testPhone}
                                                                    onChange={(e) => setTestPhone(e.target.value)}
                                                                    required
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-slate-700">Message Body</Label>
                                                                <Textarea
                                                                    rows={3}
                                                                    value={testBody}
                                                                    onChange={(e) => setTestBody(e.target.value)}
                                                                    required
                                                                    className="text-xs resize-none"
                                                                />
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={() => setTestDialogOpen(false)}
                                                                    className="text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="submit"
                                                                    disabled={isSendingTest}
                                                                    className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs font-semibold"
                                                                >
                                                                    {isSendingTest ? (
                                                                        <>
                                                                            <Loader2 className="animate-spin mr-1" size={13} />
                                                                            Sending...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Send className="mr-1" size={13} />
                                                                            Send Message
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    variant="outline"
                                                    onClick={handleDisconnect}
                                                    disabled={disconnect.isPending}
                                                    className="border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs h-10 px-5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    {disconnect.isPending ? (
                                                        <>
                                                            <Loader2 className="animate-spin" size={14} />
                                                            Disconnecting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <WifiOff size={14} />
                                                            Disconnect Account
                                                        </>
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {configReady && !sdkLoaded && (
                                        <p className="text-xs text-slate-400 animate-pulse">Initializing Facebook Client JavaScript SDK...</p>
                                    )}
                                </CardContent>
                            </Card>

                        </div>

                        {/* Right Side: Onboarding Walkthrough Steps */}
                        <div className="lg:col-span-5 space-y-6">
                            <Card className="bg-white border border-[#EAE6DF] shadow-[0_2px_8px_-2px_rgba(10,30,10,0.04)] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#FAF8F5] pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                                            <HelpCircle className="text-[#35877D]" size={18} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-[#0B2E1E]">How It Works</CardTitle>
                                            <CardDescription className="text-xs text-slate-400">Step-by-step onboarding walkthrough.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="relative border-l border-emerald-100/70 ml-3 pl-6 space-y-6 py-1">
                                        {[
                                            "Click the 'Connect WhatsApp' button to launch Meta Embedded Signup Popup.",
                                            "Log in with Facebook and select the target Business Manager Profile.",
                                            "Choose or register your WhatsApp Business phone number and verify it.",
                                            "Permit access mapping so our API can synchronise channels & tokens automatically.",
                                            "Configure the Callback URL & Verify Token inside Meta Console webhook settings.",
                                        ].map((step, i) => (
                                            <div key={i} className="relative flex items-start">
                                                <span className="absolute left-[-34px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#35877D] text-white text-xs font-medium border-2 border-white shadow-sm shrink-0">
                                                    {i + 1}
                                                </span>
                                                <div>
                                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{step}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#35877D] font-semibold">
                                        <a href="https://developers.facebook.com/docs/whatsapp/embedded-signup/" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                                            Meta Embedded Documentation
                                            <ArrowUpRight size={13} />
                                        </a>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </TabsContent>

                {/* TAB 2: AUTO-REPLY RULES */}
                <TabsContent value="rules" className="space-y-6 animate-in fade-in duration-200">
                    <div className="grid gap-6 lg:grid-cols-12 items-start">

                        {/* Left Column: Automation Rules list */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="bg-white border border-[#EAE6DF] shadow-[0_2px_8px_-2px_rgba(10,30,10,0.04)] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#FAF8F5] pb-4 flex flex-row items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-[#0B2E1E]">Active Auto-Reply Rules</CardTitle>
                                        <CardDescription className="text-xs text-slate-400">Trigger automatic responses on incoming keyword matches.</CardDescription>
                                    </div>
                                    <Badge className="bg-[#35877D]/10 text-[#35877D] font-bold border-none text-xs rounded-lg px-2.5 py-0.5">
                                        {automations ? automations.length : 0} Rules
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {isLoadingAutomations ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-16 w-full rounded-xl" />
                                            <Skeleton className="h-16 w-full rounded-xl" />
                                            <Skeleton className="h-16 w-full rounded-xl" />
                                        </div>
                                    ) : !automations || automations.length === 0 ? (
                                        <div className="text-center py-10 px-4 flex flex-col items-center">
                                            <div className="h-12 w-12 rounded-2xl bg-[#35877D]/8 text-[#35877D] flex items-center justify-center mb-4">
                                                <Zap size={22} />
                                            </div>
                                            <h3 className="text-xs font-medium text-[#0B2E1E]">No auto-reply rules configured</h3>
                                            <p className="text-slate-400 text-xs mt-1 max-w-sm leading-normal">
                                                Add keywords to match incoming user messages and define automated replies (e.g. Price matching or greeting alerts).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {automations.map((rule) => {
                                                const ruleActive = rule.status === 1 || rule.status === true;
                                                return (
                                                    <div
                                                        key={rule.id}
                                                        className={`border rounded-xl p-4 transition-all duration-200 bg-white ${ruleActive ? "border-[#35877D]/30 shadow-[0_2px_6px_-3px_rgba(53,135,125,0.06)]" : "border-slate-200 bg-slate-50/40 opacity-70"}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <h4 className="text-xs font-medium text-[#0B2E1E]">
                                                                        {rule.name || "Auto-Reply Rule"}
                                                                    </h4>
                                                                    <Badge className="bg-[#35877D]/8 text-[#35877D] border-0 text-xs font-semibold rounded px-2 py-0.5">
                                                                        Keyword: "{rule.keyword}"
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-slate-600 leading-normal font-medium max-w-prose">
                                                                    {rule.reply}
                                                                </p>
                                                            </div>

                                                            {/* Actions column */}
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <Switch
                                                                    checked={ruleActive}
                                                                    onCheckedChange={() => handleToggleStatus(rule.id, rule.status)}
                                                                    className="cursor-pointer"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteRule(rule.id)}
                                                                    disabled={deleteAutomation.isPending}
                                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg cursor-pointer transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Bottom Rule Metrics */}
                                                        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-semibold">
                                                            <span className="flex items-center gap-1 text-slate-500">
                                                                <Zap size={11} className="text-[#35877D]" />
                                                                Executed {rule.executed_count || 0} times
                                                            </span>
                                                            <span>
                                                                Created {new Date(rule.created_at).toLocaleDateString("en-IN")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Creation form */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="bg-white border border-[#EAE6DF] shadow-[0_2px_8px_-2px_rgba(10,30,10,0.04)] rounded-2xl overflow-hidden">
                                <CardHeader className="border-b border-[#FAF8F5] pb-4">
                                    <CardTitle className="text-sm font-bold text-[#0B2E1E]">Add Auto-Reply Rule</CardTitle>
                                    <CardDescription className="text-xs text-slate-400">Configure new keyword triggers.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <form onSubmit={handleCreateRule} className="space-y-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="ruleName" className="text-xs font-medium text-slate-500">Rule Name (Optional)</Label>
                                            <Input
                                                id="ruleName"
                                                type="text"
                                                placeholder="e.g., Pricing Inquiry"
                                                value={ruleName}
                                                onChange={(e) => setRuleName(e.target.value)}
                                                className="border-[#EAE6DF] hover:border-slate-300 focus:border-[#35877D] rounded-lg text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="ruleKeyword" className="text-xs font-medium text-slate-500 flex items-center justify-between">
                                                <span>Match Keyword</span>
                                                <span className="text-[9.5px] font-medium text-slate-400 font-sans">Case-insensitive match</span>
                                            </Label>
                                            <Input
                                                id="ruleKeyword"
                                                type="text"
                                                placeholder="e.g., price, cost, product"
                                                value={ruleKeyword}
                                                onChange={(e) => setRuleKeyword(e.target.value)}
                                                required
                                                className="border-[#EAE6DF] hover:border-slate-300 focus:border-[#35877D] rounded-lg text-xs"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="ruleReply" className="text-xs font-medium text-slate-500">Reply Message</Label>
                                            <Textarea
                                                id="ruleReply"
                                                rows={4}
                                                placeholder="Write your automated WhatsApp response text here..."
                                                value={ruleReply}
                                                onChange={(e) => setRuleReply(e.target.value)}
                                                required
                                                className="border-[#EAE6DF] hover:border-slate-300 focus:border-[#35877D] rounded-lg text-xs resize-none"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={createAutomation.isPending || !ruleKeyword || !ruleReply}
                                            className="w-full bg-[#35877D] hover:bg-[#2c6f66] text-white font-semibold text-xs h-9 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer border-0"
                                        >
                                            {createAutomation.isPending ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={13} />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={14} />
                                                    Add Rule
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between border-b border-[#FAF8F5] py-3.5 px-4 last:border-none last:pb-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-500 font-medium">
                <Icon size={14} className="text-slate-400 shrink-0" />
                <span>{label}</span>
            </div>
            <code className="font-mono text-xs text-[#0B2E1E] bg-[#FAF8F5] border border-[#EAE6DF] px-2.5 py-1 rounded-lg break-all select-all font-semibold">
                {value}
            </code>
        </div>
    );
}
