"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    useGetWhatsappStatus,
    useExchangeMetaToken,
    useDisconnectWhatsapp,
    getGetWhatsappStatusQueryKey,
    apiFetch,
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
import { PageHeader } from "@/components/page-header";
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
    Key,
    Sliders,
    ShieldAlert,
    AlertTriangle,
    ExternalLink,
    Check,
    Copy,
    Terminal,
    ChevronRight,
    MessageCircle
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

interface MetaConfigData {
    appId: string | null;
    configId: string | null;
    graphApiVersion: string | null;
    redirectUri: string | null;
    verifyToken: string | null;
    debug: boolean;
}

interface SessionInfoData {
    waba_id?: string;
    phone_number_id?: string;
    business_id?: string;
    event?: string;
    current_step?: string;
    error_message?: string;
    raw?: any;
}

const STATUS_CONFIG = {
    connected: { label: "Connected", icon: CheckCircle2, color: "text-[#35877D]", badge: "bg-emerald-50 text-[#35877D] border-emerald-100" },
    pending_registration: { label: "Pending Registration", icon: Clock, color: "text-amber-600", badge: "bg-amber-50 text-amber-800 border-amber-200" },
    pending: { label: "Pending", icon: Clock, color: "text-amber-600", badge: "bg-amber-50 text-amber-800 border-amber-100" },
    failed: { label: "Failed", icon: XCircle, color: "text-red-600", badge: "bg-red-50 text-red-800 border-red-100" },
    disconnected: { label: "Disconnected", icon: WifiOff, color: "text-slate-400", badge: "bg-slate-50 text-slate-500 border-slate-200" },
};

function useMetaConfig() {
    return useQuery<MetaConfigData>({
        queryKey: ["metaConfig"],
        queryFn: async () => {
            const res = await fetch("/api/meta/config");
            return res.json();
        },
        staleTime: Infinity,
    });
}

function useFacebookSdk(appId: string | null | undefined, version: string = "v22.0") {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined" || !appId) return;
        if (window.FB) { setLoaded(true); return; }

        const script = document.createElement("script");
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.FB?.init({ appId, cookie: true, xfbml: true, version: version || "v22.0" });
            setLoaded(true);
        };
        document.body.appendChild(script);
    }, [appId, version]);

    return loaded;
}

export default function WhatsAppIntegrationPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Redirect legacy URL parameter '?tab=auto-reply' or '?tab=rules' to the dedicated page
    useEffect(() => {
        if (typeof window === "undefined") return;
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get("tab");
        if (tab === "auto-reply" || tab === "rules") {
            router.replace("/automations/auto-replies");
        }
    }, [router]);

    // Test message dialog state
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testBody, setTestBody] = useState("Hello from Connectly360! This is a test WhatsApp message.");
    const [testMessageType, setTestMessageType] = useState<"template" | "text">("template");
    const [isSendingTest, setIsSendingTest] = useState(false);

    // Phone registration state (Meta 6-digit PIN 2-step verification)
    const [isRegisteringPhone, setIsRegisteringPhone] = useState(false);
    const [registerPin, setRegisterPin] = useState("");
    const [registerPinConfirm, setRegisterPinConfirm] = useState("");
    const [pinError, setPinError] = useState("");
    const [currentRegistrationStep, setCurrentRegistrationStep] = useState(3);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [retryMode, setRetryMode] = useState(false);

    // Manual authorization code dialog state
    const [manualCodeOpen, setManualCodeOpen] = useState(false);
    const [manualCodeInput, setManualCodeInput] = useState("");

    const { data: metaConfig, isLoading: isLoadingConfig } = useMetaConfig();
    const sdkLoaded = useFacebookSdk(metaConfig?.appId, metaConfig?.graphApiVersion || "v22.0");

    const sessionInfoRef = useRef<SessionInfoData | null>(null);
    const [diagnosticLogs, setDiagnosticLogs] = useState<Array<{ time: string; msg: string; type?: string }>>([]);
    const [metaErrorModalOpen, setMetaErrorModalOpen] = useState(false);
    const [metaErrorDetails, setMetaErrorDetails] = useState<any>(null);
    const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);

    const logDebug = useCallback((msg: string, type: "info" | "warn" | "error" = "info") => {
        const time = new Date().toLocaleTimeString();
        if (metaConfig?.debug || process.env.NODE_ENV === "development") {
            console.log(`[Meta WhatsApp SDK ${time}]`, msg);
        }
        setDiagnosticLogs(prev => [...prev.slice(-30), { time, msg, type }]);
    }, [metaConfig?.debug]);

    const { data: account, isLoading: isLoadingStatus } = useGetWhatsappStatus({
        query: { queryKey: getGetWhatsappStatusQueryKey() },
    });

    const exchangeToken = useExchangeMetaToken();
    const disconnect = useDisconnectWhatsapp();

    const refreshStatus = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
        toast({ title: "Refreshed", description: "WhatsApp integration status reloaded." });
    }, [queryClient, toast]);

    const handleSyncAccount = async () => {
        setIsSyncing(true);
        try {
            const res = await apiFetch("/api/whatsapp/sync", { method: "POST" });
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
            const res = await apiFetch("/api/whatsapp/test-connection", { method: "POST" });
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
        if (!testPhone.trim()) {
            toast({ title: "Validation Error", description: "Recipient phone number is required.", variant: "destructive" });
            return;
        }
        if (testMessageType === "text" && !testBody.trim()) {
            toast({ title: "Validation Error", description: "Message body is required for text messages.", variant: "destructive" });
            return;
        }

        setIsSendingTest(true);
        try {
            const payload: any = {
                to: testPhone.trim(),
                source: "test"
            };
            if (testMessageType === "template") {
                payload.type = "template";
                payload.template_name = "hello_world";
                payload.language = "en_US";
            } else {
                payload.type = "text";
                payload.body = testBody.trim();
            }

            const res = await apiFetch("/api/whatsapp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Message Dispatched!", description: `Meta message sent to ${testPhone}. Delivery updates via webhook.` });
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

    const handleRegisterPhone = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!registerPin || registerPin.length !== 6 || !/^\d{6}$/.test(registerPin)) {
            setPinError("PIN must be exactly 6 digits (numbers only).");
            return;
        }
        if (registerPin !== registerPinConfirm) {
            setPinError("PIN confirmation does not match.");
            return;
        }
        setPinError("");
        setIsRegisteringPhone(true);
        setCurrentRegistrationStep(3); // Step 3: Registering phone number

        try {
            const tenantId = (account as any)?.tenant_id || (account as any)?.tenantId;
            const res = await apiFetch("/api/whatsapp/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pin: registerPin,
                    pin_confirmation: registerPinConfirm,
                    tenant_id: tenantId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setCurrentRegistrationStep(4); // Step 4: Connecting webhooks
                setTimeout(() => {
                    setCurrentRegistrationStep(5); // Step 5: Ready
                    toast({
                        title: "Registration Complete!",
                        description: "Your WhatsApp phone number has been registered with Meta and webhooks are active.",
                    });
                    queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
                    setIsRegisteringPhone(false);
                    setRegisterPin("");
                    setRegisterPinConfirm("");
                    setRetryMode(false);
                }, 700);
            } else {
                setIsRegisteringPhone(false);
                toast({
                    title: "Registration Failed",
                    description: data.message || "Meta could not register this phone number.",
                    variant: "destructive",
                });
                queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
            }
        } catch (err: any) {
            setIsRegisteringPhone(false);
            toast({
                title: "Registration Error",
                description: String(err),
                variant: "destructive",
            });
        }
    };

    const handleExchangeCode = useCallback((code: string, sessionInfo?: SessionInfoData | null) => {
        setIsConnecting(true);
        logDebug(`Exchanging authorization code with backend. WABA: ${sessionInfo?.waba_id ? "YES" : "NO"}, Phone: ${sessionInfo?.phone_number_id ? "YES" : "NO"}`);

        exchangeToken.mutate(
            {
                data: {
                    code,
                    redirect_uri: "", // Omit redirect_uri for Facebook JS SDK popup flow to avoid Meta Error 191
                    waba_id: sessionInfo?.waba_id,
                    phone_number_id: sessionInfo?.phone_number_id,
                    business_id: sessionInfo?.business_id,
                } as any,
            },
            {
                onSuccess: (res: any) => {
                    logDebug("WhatsApp account authorization exchanged.");
                    queryClient.invalidateQueries({ queryKey: getGetWhatsappStatusQueryKey() });
                    if (res?.registration_required || res?.status === "pending_registration") {
                        toast({
                            title: "Authorization Verified",
                            description: "Phone number discovered. Please complete the 6-digit PIN registration below.",
                        });
                    } else {
                        toast({ title: "WhatsApp connected", description: "Your WhatsApp Business account has been connected successfully." });
                    }
                    setIsConnecting(false);
                    if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                },
                onError: (err: any) => {
                    logDebug(`Token exchange error: ${String(err?.message || err)}`, "error");
                    toast({ title: "Connection failed", description: String(err?.message || err), variant: "destructive" });
                    setIsConnecting(false);
                    if (typeof window !== "undefined") {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                },
            }
        );
    }, [exchangeToken, queryClient, toast, logDebug]);

    // Auto-process code parameter from Meta OAuth redirect callback
    useEffect(() => {
        if (typeof window === "undefined") return;
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        if (code) {
            handleExchangeCode(code, sessionInfoRef.current);
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
        setIsConnecting(true);
        exchangeToken.mutate(
            {
                data: {
                    code: manualCodeInput.trim(),
                    redirect_uri: "",
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

    const statusKey = (account?.status ?? "disconnected") as keyof typeof STATUS_CONFIG;
    const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.disconnected;
    const StatusIcon = statusCfg.icon;
    const isConnected = account?.status === "connected";
    const configReady = !!metaConfig?.appId && !!metaConfig?.configId;
    const regStatus = (account as any)?.registration_status;
    const isRegistrationPending = (account as any)?.registration_required || (account as any)?.status === "pending_registration" || regStatus === "REGISTRATION_PENDING" || (regStatus === "NOT_REGISTERED" && !!account?.phoneNumber);
    const isRegistrationFailed = regStatus === "REGISTRATION_FAILED";
    const isRegistrationSuccess = regStatus === "REGISTERED" || regStatus === "CONNECTED" || isConnected;
    const isExpired = !!(account as any)?.is_expired;

    return (
        <div className="space-y-6 w-full">
            {/* Page Header */}
            <PageHeader
                icon={MessageCircle}
                title="WhatsApp Integration"
                description="Connect and manage your WhatsApp Business API, phone numbers, webhooks and messaging configuration."
                breadcrumbs={[
                    { label: "Channels & Integrations", href: "/integrations" },
                    { label: "WhatsApp" }
                ]}
                badge={isConnected ? "Active WABA" : undefined}
                actions={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/automations/auto-replies"
                            className="border border-[#35877D]/30 bg-[#35877D]/5 hover:bg-[#35877D]/10 text-[#35877D] rounded-xl flex items-center gap-1.5 text-xs font-semibold h-9 px-3.5 transition-colors shadow-2xs"
                        >
                            <span>Auto-Reply Rules</span>
                            <ArrowUpRight size={13} />
                        </Link>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshStatus}
                            className="border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-2 text-xs font-semibold cursor-pointer h-9 px-4"
                        >
                            <RefreshCcw size={13} className={isLoadingStatus ? "animate-spin text-[#35877D]" : "text-slate-500"} />
                            Refresh Status
                        </Button>

                        {isConnected && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-[#35877D] text-xs font-semibold border border-emerald-200 shadow-2xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35877D] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35877D]"></span>
                                </span>
                                Connected
                            </span>
                        )}
                    </div>
                }
            />

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

            {/* Main Connection & Webhooks Interface */}
            <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid gap-6 lg:grid-cols-12 items-start">

                    {/* Left Side: status card */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* WhatsApp Phone Registration Stage Card (Meta Embedded Signup 2-Step Verification) */}
                        {(isRegistrationPending || isRegistrationFailed || isExpired || isRegisteringPhone) && (
                            <Card className="bg-white border-2 border-[#35877D]/30 shadow-md rounded-2xl overflow-hidden animate-in fade-in duration-300">
                                <CardHeader className="bg-gradient-to-r from-emerald-50/50 via-[#FAF8F5] to-emerald-50/30 border-b border-emerald-100/60 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-[#35877D]/10 text-[#35877D]">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold text-[#0B2E1E]">WhatsApp Phone Registration</CardTitle>
                                                <CardDescription className="text-xs text-slate-500">
                                                    {isRegisteringPhone ? "Registering your WhatsApp number with Meta..." : "Register your phone number with Meta Cloud API to activate live messaging."}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge className={
                                            isRegistrationFailed ? "bg-red-50 text-red-700 border-red-200 uppercase tracking-wider text-[10px]" :
                                                isRegisteringPhone ? "bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider text-[10px]" :
                                                    "bg-amber-50 text-amber-800 border-amber-200 uppercase tracking-wider text-[10px]"
                                        }>
                                            {isRegistrationFailed ? "Registration Failed" : isRegisteringPhone ? "Registering..." : "Pending PIN"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    {/* 5-Step Process Pipeline */}
                                    <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/70">
                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                                            {/* Step 1 */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">✓</div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-[11px]">Step 1</div>
                                                    <div className="text-[11px] text-emerald-700 font-medium">Account connected</div>
                                                </div>
                                            </div>
                                            {/* Step 2 */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">✓</div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-[11px]">Step 2</div>
                                                    <div className="text-[11px] text-emerald-700 font-medium">Phone verified</div>
                                                </div>
                                            </div>
                                            {/* Step 3 */}
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${isRegistrationSuccess ? "bg-emerald-100 text-emerald-700" :
                                                    isRegistrationFailed ? "bg-red-100 text-red-700" :
                                                        isRegisteringPhone && currentRegistrationStep === 3 ? "bg-blue-500 text-white animate-pulse" :
                                                            "bg-amber-500 text-white"
                                                    }`}>
                                                    {isRegistrationSuccess ? "✓" : isRegistrationFailed ? "✕" : "●"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-[11px]">Step 3</div>
                                                    <div className={`text-[11px] font-medium ${isRegistrationSuccess ? "text-emerald-700" :
                                                        isRegistrationFailed ? "text-red-700 font-bold" :
                                                            isRegisteringPhone ? "text-blue-700 font-bold" : "text-amber-800 font-bold"
                                                        }`}>
                                                        {isRegistrationSuccess ? "Phone registered" : isRegisteringPhone ? "Registering phone..." : "Register phone"}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Step 4 */}
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${(account as any)?.webhook_status === "SUBSCRIBED" || isRegistrationSuccess ? "bg-emerald-100 text-emerald-700" :
                                                    isRegisteringPhone && currentRegistrationStep >= 4 ? "bg-blue-500 text-white animate-pulse" :
                                                        "bg-slate-200 text-slate-500"
                                                    }`}>
                                                    {(account as any)?.webhook_status === "SUBSCRIBED" || isRegistrationSuccess ? "✓" : isRegisteringPhone && currentRegistrationStep >= 4 ? "●" : "4"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-[11px]">Step 4</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">
                                                        {(account as any)?.webhook_status === "SUBSCRIBED" ? "Webhooks active" : "Connecting webhooks"}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Step 5 */}
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                                                    }`}>
                                                    {isConnected ? "✓" : "5"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-[11px]">Step 5</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">
                                                        {isConnected ? "Ready & Live" : "Ready"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 14-day rule expiration notice */}
                                    {isExpired && (
                                        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-800 space-y-2">
                                            <div className="flex items-center gap-2 font-bold text-red-900">
                                                <AlertTriangle size={16} />
                                                WhatsApp onboarding has expired. Please reconnect your WhatsApp account.
                                            </div>
                                            <p className="text-red-700 leading-relaxed">
                                                Meta requires phone registration to be completed within 14 days of Embedded Signup. Because this timeframe has expired, please reconnect your WhatsApp account.
                                            </p>
                                            <Button onClick={launchEmbeddedSignup} size="sm" className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 rounded-lg cursor-pointer">
                                                Reconnect WhatsApp Account
                                            </Button>
                                        </div>
                                    )}

                                    {/* Registration Failed View */}
                                    {isRegistrationFailed && !isExpired && !retryMode && (
                                        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3">
                                            <div className="flex items-start gap-2.5">
                                                <XCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-sm text-red-900">WhatsApp number registration failed.</h4>
                                                    <p className="text-xs text-red-700 leading-relaxed">
                                                        Meta could not register this phone number. {(account as any)?.last_registration_error?.message || "Please verify your 6-digit PIN and ensure Meta WhatsApp business verification is complete."}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setPinError(""); setRetryMode(true); }}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-8 px-3 rounded-lg cursor-pointer"
                                                >
                                                    Retry Registration
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={refreshStatus}
                                                    className="border-red-200 text-red-700 hover:bg-red-100/50 text-xs h-8 px-3 rounded-lg cursor-pointer"
                                                >
                                                    <RefreshCcw size={12} className="mr-1.5" />
                                                    Refresh Status
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                                                    className="text-xs text-slate-500 hover:text-slate-800 h-8 ml-auto"
                                                >
                                                    <Terminal size={12} className="mr-1" />
                                                    {showDiagnostics ? "Hide Diagnostics" : "Technical Diagnostics"}
                                                </Button>
                                            </div>

                                            {/* Technical Diagnostics */}
                                            {showDiagnostics && (account as any)?.last_registration_error && (
                                                <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto">
                                                    <div>Meta Error Code: {(account as any)?.last_registration_error?.code ?? "N/A"}</div>
                                                    <div>Meta Error Message: {(account as any)?.last_registration_error?.message ?? "N/A"}</div>
                                                    <div>FB Trace ID: {(account as any)?.last_registration_error?.fbtrace_id ?? "N/A"}</div>
                                                    <div>HTTP Status: {(account as any)?.last_registration_error?.http_status ?? "N/A"}</div>
                                                    <div>Request ID: {(account as any)?.last_registration_error?.request_id ?? "N/A"}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Secure 6-Digit PIN Registration Form */}
                                    {(!isRegistrationFailed || retryMode) && !isExpired && !isRegistrationSuccess && (
                                        <form onSubmit={handleRegisterPhone} className="space-y-4 pt-1">
                                            <div className="space-y-1">
                                                <h4 className="text-xs font-bold text-slate-800">Register WhatsApp Number</h4>
                                                <p className="text-xs text-slate-500">
                                                    Create a 6-digit WhatsApp registration PIN.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-slate-700">PIN</Label>
                                                    <Input
                                                        type="password"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        placeholder="• • • • • •"
                                                        value={registerPin}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                            setRegisterPin(val);
                                                            setPinError("");
                                                        }}
                                                        disabled={isRegisteringPhone}
                                                        className="h-10 text-center tracking-widest font-mono text-base bg-white"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-semibold text-slate-700">Confirm PIN</Label>
                                                    <Input
                                                        type="password"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        placeholder="• • • • • •"
                                                        value={registerPinConfirm}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                            setRegisterPinConfirm(val);
                                                            setPinError("");
                                                        }}
                                                        disabled={isRegisteringPhone}
                                                        className="h-10 text-center tracking-widest font-mono text-base bg-white"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {pinError && (
                                                <p className="text-xs font-medium text-red-600">{pinError}</p>
                                            )}

                                            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-3 text-xs text-emerald-900 flex items-start gap-2">
                                                <ShieldCheck size={16} className="text-[#35877D] shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-semibold">Security Notice: </span>
                                                    This PIN is used for WhatsApp two-step verification. Store it securely.
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={isRegisteringPhone || registerPin.length !== 6 || registerPinConfirm.length !== 6}
                                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white font-semibold text-xs h-10 px-6 rounded-xl cursor-pointer w-full sm:w-auto shadow-xs"
                                            >
                                                {isRegisteringPhone ? (
                                                    <>
                                                        <Loader2 className="animate-spin mr-2" size={14} />
                                                        Registering your WhatsApp number...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheck className="mr-2" size={14} />
                                                        Register Number
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}

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
                                                            <Label className="text-xs font-semibold text-slate-700">Message Type</Label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTestMessageType("template")}
                                                                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${testMessageType === "template"
                                                                        ? "border-[#35877D] bg-emerald-50/50 text-[#35877D] shadow-2xs"
                                                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                        }`}
                                                                >
                                                                    <div className="font-bold">hello_world Template</div>
                                                                    <div className="text-[10px] text-slate-500 font-normal">Pre-approved by Meta for testing</div>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setTestMessageType("text")}
                                                                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${testMessageType === "text"
                                                                        ? "border-[#35877D] bg-emerald-50/50 text-[#35877D] shadow-2xs"
                                                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                        }`}
                                                                >
                                                                    <div className="font-bold">Custom Text</div>
                                                                    <div className="text-[10px] text-slate-500 font-normal">Requires active 24h window</div>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-semibold text-slate-700">Recipient Phone Number (with Country Code)</Label>
                                                            <Input
                                                                placeholder="e.g. +919876543210"
                                                                value={testPhone}
                                                                onChange={(e) => setTestPhone(e.target.value)}
                                                                required
                                                                className="text-xs font-mono"
                                                            />
                                                        </div>

                                                        {testMessageType === "text" ? (
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
                                                        ) : (
                                                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
                                                                <div className="font-semibold text-slate-800">Template Preview:</div>
                                                                <div className="italic bg-white p-2 rounded border border-slate-200 text-slate-700 font-sans">
                                                                    "Hello World! Welcome and congratulations! This message confirms your WhatsApp Business Cloud API integration is connected and functioning."
                                                                </div>
                                                            </div>
                                                        )}
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

                                {/* Meta Error Diagnostic Modal */}
                                <Dialog open={metaErrorModalOpen} onOpenChange={setMetaErrorModalOpen}>
                                    <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                                        <DialogHeader>
                                            <div className="flex items-center gap-2 text-red-600 mb-1">
                                                <ShieldAlert size={20} />
                                                <DialogTitle className="text-base font-bold text-slate-900">
                                                    WhatsApp Connection Could Not Be Started
                                                </DialogTitle>
                                            </div>
                                            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
                                                Meta rejected the Facebook Login / Embedded Signup popup before onboarding could complete.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 pt-2 text-xs">
                                            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 space-y-1.5">
                                                <div className="font-semibold text-red-900 flex items-center gap-2">
                                                    <AlertTriangle size={15} className="text-red-600" />
                                                    Meta Error: "Feature unavailable"
                                                </div>
                                                <p className="text-red-800 text-[11.5px] leading-relaxed">
                                                    &ldquo;Facebook Login is currently unavailable for this app as we are updating additional details for this app. Please try again later.&rdquo;
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <span className="font-bold text-slate-800 block text-xs">Why Meta Rejects This App / Configuration:</span>
                                                <div className="space-y-2 text-slate-700">
                                                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                                                        <strong className="text-slate-900 block font-semibold">1. App Mode & Unauthorized User</strong>
                                                        <p className="text-[11.5px] text-slate-600">
                                                            If the Meta App is in <strong>Development Mode</strong>, only registered App Admins, Developers, and Testers can log in. The logged-in Facebook account must be added under <strong>App Roles &gt; Roles</strong>.
                                                        </p>
                                                    </div>

                                                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                                                        <strong className="text-slate-900 block font-semibold">2. App Domains & Allowed Domains Missing</strong>
                                                        <p className="text-[11.5px] text-slate-600">
                                                            The active domain (<code className="font-mono bg-white px-1 py-0.5 border rounded">app.connectly360.com</code>) must be configured in Meta App Settings &gt; Basic (&quot;App Domains&quot;) and under Facebook Login for Business &gt; Settings (&quot;Allowed Domains for JavaScript SDK&quot;).
                                                        </p>
                                                    </div>

                                                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                                                        <strong className="text-slate-900 block font-semibold">3. Standard vs Advanced Access for Permissions</strong>
                                                        <p className="text-[11.5px] text-slate-600">
                                                            In Live mode, Meta blocks login unless <code className="font-mono bg-white px-1 py-0.5 border rounded">public_profile</code> and <code className="font-mono bg-white px-1 py-0.5 border rounded">whatsapp_business_management</code> have <strong>Advanced Access</strong>.
                                                        </p>
                                                    </div>

                                                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                                                        <strong className="text-slate-900 block font-semibold">4. Facebook Login for Business Configuration (v4)</strong>
                                                        <p className="text-[11.5px] text-slate-600">
                                                            The Configuration ID (<code className="font-mono bg-white px-1 py-0.5 border rounded">{metaErrorDetails?.configIdMasked || '44152437****'}</code>) must be an active, approved Embedded Signup v4 configuration created inside the Meta Developer Dashboard.
                                                        </p>
                                                    </div>

                                                    <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                                                        <strong className="text-slate-900 block font-semibold">5. Data Use Checkup (DUC) or Business Verification</strong>
                                                        <p className="text-[11.5px] text-slate-600">
                                                            Meta requires an annual Data Use Checkup in the Developer Dashboard and Meta Business Verification for partner onboarding.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-slate-200 space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                                                    <span>ADMIN TECHNICAL DIAGNOSTICS</span>
                                                    <span>Graph API: {metaErrorDetails?.graphApiVersion || "v22.0"}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                                    <div>App ID: {metaErrorDetails?.appIdMasked || "N/A"}</div>
                                                    <div>Config ID: {metaErrorDetails?.configIdMasked || "N/A"}</div>
                                                    <div>Origin: {metaErrorDetails?.origin || "N/A"}</div>
                                                    <div>Last Event: {metaErrorDetails?.lastSessionEvent || "N/A"}</div>
                                                </div>
                                                {metaErrorDetails?.sdkResponse && (
                                                    <div className="text-[10px] font-mono bg-black/40 p-2 rounded overflow-x-auto text-slate-400">
                                                        {JSON.stringify(metaErrorDetails.sdkResponse)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <DialogFooter className="gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setMetaErrorModalOpen(false)}
                                                className="text-xs h-9"
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setMetaErrorModalOpen(false);
                                                    setDiagnosticsModalOpen(true);
                                                }}
                                                className="bg-slate-800 hover:bg-slate-700 text-white text-xs h-9 px-4 rounded-lg"
                                            >
                                                View Full Checklist
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setMetaErrorModalOpen(false);
                                                    launchEmbeddedSignup();
                                                }}
                                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs h-9 px-4 rounded-lg"
                                            >
                                                Retry Connection
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Full Meta Developer Checklist Modal */}
                                <Dialog open={diagnosticsModalOpen} onOpenChange={setDiagnosticsModalOpen}>
                                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                                        <DialogHeader>
                                            <div className="flex items-center gap-2 text-[#35877D] mb-1">
                                                <Sliders size={20} />
                                                <DialogTitle className="text-base font-bold text-slate-900">
                                                    Meta Embedded Signup v4 Checklist &amp; Diagnostics
                                                </DialogTitle>
                                            </div>
                                            <DialogDescription className="text-xs text-slate-600">
                                                Complete configuration status and checklist for WhatsApp Cloud API &amp; Embedded Signup v4.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 pt-2 text-xs">
                                            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                                                <span className="font-semibold text-slate-800 block text-xs">Environment &amp; Meta Credentials Status</span>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] text-slate-700">
                                                    <div>
                                                        <span className="text-slate-500">App ID:</span>{" "}
                                                        <strong className="font-mono text-slate-900">{metaConfig?.appId ? `${metaConfig.appId.slice(0, 4)}****${metaConfig.appId.slice(-4)}` : "Missing"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Config ID:</span>{" "}
                                                        <strong className="font-mono text-slate-900">{metaConfig?.configId ? `${metaConfig.configId.slice(0, 4)}****${metaConfig.configId.slice(-4)}` : "Missing"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Graph API Version:</span>{" "}
                                                        <strong className="font-mono text-slate-900">{metaConfig?.graphApiVersion || "v22.0"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Redirect URI:</span>{" "}
                                                        <strong className="font-mono text-slate-900">{metaConfig?.redirectUri || "https://app.connectly360.com/integrations/whatsapp"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Webhook Token:</span>{" "}
                                                        <strong className="font-mono text-slate-900">{metaConfig?.verifyToken ? "Configured" : "Missing"}</strong>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Debug Mode:</span>{" "}
                                                        <strong className="font-mono text-emerald-700">{metaConfig?.debug ? "Enabled" : "Disabled"}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <span className="font-bold text-slate-800 block text-xs">Exact Meta Dashboard Setup Checklist:</span>
                                                <div className="space-y-2 text-slate-700">
                                                    {[
                                                        { num: 1, title: "App Mode (Development vs Live)", desc: "If in Development mode, ensure your logged-in Facebook user account is added under App Roles > Roles as an Administrator, Developer, or Tester. In Live mode, ensure business verification is complete." },
                                                        { num: 2, title: "App Domains (Settings > Basic)", desc: "Add 'connectly360.com' and 'app.connectly360.com' to App Domains. Set Privacy Policy URL and Terms of Service URL." },
                                                        { num: 3, title: "Facebook Login for Business Product", desc: "Ensure 'Facebook Login for Business' is added as a product to your app. Under Settings, add 'https://app.connectly360.com' to Allowed Domains for JavaScript SDK." },
                                                        { num: 4, title: "Configurations (Login for Business / WhatsApp)", desc: "Verify configuration ID '4415243742081393' exists in your App Dashboard under Facebook Login for Business > Configurations or WhatsApp > Embedded Signup Builder. Ensure it uses v4 parameters." },
                                                        { num: 5, title: "Required Permissions & Advanced Access", desc: "Ensure 'whatsapp_business_management' and 'whatsapp_business_messaging' are selected in the configuration. For Live mode, grant Advanced Access under App Review > Permissions and Features." },
                                                        { num: 6, title: "Webhooks (WhatsApp)", desc: "Callback URL: 'https://api.connectly360.com/api/whatsapp/webhook', Verify Token: 'connectly360_verify_token_secure_9ae7b3', subscribed fields: 'messages'." }
                                                    ].map(item => (
                                                        <div key={item.num} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-5 w-5 rounded-full bg-[#35877D] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                                                    {item.num}
                                                                </span>
                                                                <strong className="text-slate-900 font-semibold text-xs">{item.title}</strong>
                                                            </div>
                                                            <p className="text-[11.5px] text-slate-600 pl-7 leading-relaxed">{item.desc}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {diagnosticLogs.length > 0 && (
                                                <div className="border border-slate-200 rounded-xl p-3 bg-slate-950 text-slate-300 space-y-1.5">
                                                    <span className="text-[11px] font-mono text-emerald-400 block font-semibold">CLIENT SDK EVENT LOG STREAM:</span>
                                                    <div className="max-h-28 overflow-y-auto space-y-1 font-mono text-[10.5px]">
                                                        {diagnosticLogs.map((log, idx) => (
                                                            <div key={idx} className={log.type === "error" ? "text-red-400" : log.type === "warn" ? "text-amber-400" : "text-slate-300"}>
                                                                [{log.time}] {log.msg}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <DialogFooter className="gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setDiagnosticsModalOpen(false)}
                                                className="text-xs h-9"
                                            >
                                                Close
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setDiagnosticsModalOpen(false);
                                                    launchEmbeddedSignup();
                                                }}
                                                className="bg-[#35877D] hover:bg-[#2c6f66] text-white text-xs h-9 px-4 rounded-lg"
                                            >
                                                Launch Meta Signup
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
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
            </div>
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
