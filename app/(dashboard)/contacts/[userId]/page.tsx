"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Phone,
    MapPin,
    Calendar,
    Send,
    Loader2,
    User,
    ShieldCheck,
    MessageCircle,
    Building2,
    Mail,
    Tag,
    Clock,
    FileText,
    CheckCircle2,
    ExternalLink,
    Edit2,
    Share2,
    Flame
} from "lucide-react";
import { toast } from "sonner";
import { StageBadge, StageKey, STAGES } from "@/components/contacts/contact-crm-panel";

interface GroupedReaction {
    emoji: string;
    count: number;
    users: string[];
}

function groupReactions(reactions: any[] = []): GroupedReaction[] {
    if (!Array.isArray(reactions) || reactions.length === 0) return [];
    const counts: { [emoji: string]: GroupedReaction } = {};
    for (const r of reactions) {
        if (!r || !r.emoji) continue;
        const emoji = r.emoji;
        if (!counts[emoji]) {
            counts[emoji] = { emoji, count: 0, users: [] };
        }
        counts[emoji].count += 1;
        if (r.contact_name) counts[emoji].users.push(r.contact_name);
        else if (r.from) counts[emoji].users.push(r.from);
    }
    return Object.values(counts);
}

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;
    const customerId = userId ? parseInt(userId, 10) : 0;
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"overview" | "conversations" | "campaigns" | "activity" | "notes">("overview");
    const [messageText, setMessageText] = useState("");
    const [notesText, setNotesText] = useState("");
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch full contact detail from enhanced CustomerController::show
    const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
        queryKey: ["customerDetail", customerId],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${customerId}`, {
                headers: { "X-Tenant-Id": "8" },
            });
            if (!res.ok) throw new Error("Contact not found");
            const json = await res.json();
            return json.data;
        },
        enabled: !!customerId,
    });

    const customer = customerData;

    useEffect(() => {
        if (customer?.notes) {
            setNotesText(customer.notes);
        }
    }, [customer?.notes]);

    // Fetch conversations
    const { data: conversations, isLoading: isLoadingConversations } = useQuery({
        queryKey: ["getCustomerConversations", customerId],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${customerId}/conversations`, {
                headers: { "X-Tenant-Id": "8" },
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!customerId,
    });

    // Send Message Mutation
    const [isSending, setIsSending] = useState(false);
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !customer) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/messages/send`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "8",
                },
                body: JSON.stringify({
                    to: customer.phone,
                    body: messageText.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || "Failed to send message");
            }
            setMessageText("");
            toast.success("Message sent successfully");
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", customerId] });
        } catch (err: any) {
            toast.error(err.message || "Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    // Save Notes
    const handleSaveNotes = async () => {
        if (!customer) return;
        setIsSavingNotes(true);
        try {
            const res = await fetch(`/api/customers/${customer.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "8",
                },
                body: JSON.stringify({ notes: notesText }),
            });
            if (!res.ok) throw new Error("Failed to save notes");
            toast.success("Contact notes saved.");
            queryClient.invalidateQueries({ queryKey: ["customerDetail", customerId] });
        } catch (err: any) {
            toast.error(err.message || "Error saving notes");
        } finally {
            setIsSavingNotes(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (activeTab === "conversations") {
            scrollToBottom();
        }
    }, [conversations, activeTab]);

    if (isLoadingCustomer) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto p-4">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-80 w-full rounded-2xl" />
                    <Skeleton className="h-80 md:col-span-2 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <h2 className="text-base font-bold text-slate-800">Contact Not Found</h2>
                <p className="text-xs text-slate-500">The requested contact record does not exist or has been deleted.</p>
                <Link href="/contacts">
                    <Button variant="outline" size="sm" className="text-xs">
                        <ArrowLeft size={14} className="mr-1.5" /> Back to Contacts
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-[1400px] mx-auto pb-16">
            {/* Page Header */}
            <PageHeader
                icon={User}
                title={customer.name || customer.phone || "Contact Details"}
                description={`${customer.phone || ""} ${customer.city ? `· ${customer.city}` : ""} · Added ${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ""}`}
                breadcrumbs={[
                    { label: "Inbox & CRM" },
                    { label: "Contacts", href: "/contacts" },
                    { label: customer.name || customer.phone || "Details" },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Link href="/contacts">
                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-xs font-semibold">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Back to Contacts
                            </Button>
                        </Link>
                        <Button
                            onClick={() => router.push(`/marketing/campaigns/new`)}
                            className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs h-9 px-4 rounded-xl font-semibold gap-1.5 shadow-sm"
                        >
                            <Send size={14} />
                            Create Campaign
                        </Button>
                    </div>
                }
            />

            {/* Profile Overview Banner Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#35877D]/10 text-[#35877D] flex items-center justify-center font-black text-xl border border-[#35877D]/20">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-slate-900">{customer.name || "WhatsApp User"}</h2>
                            <StageBadge stage={(customer.stage as StageKey) || "new_lead"} />
                            {customer.whatsapp_opt_in ? (
                                <Badge className="bg-teal-50 border-teal-200 text-teal-800 text-[10px] font-semibold gap-1">
                                    <ShieldCheck size={11} className="text-[#35877D]" />
                                    Opted-in
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px]">
                                    Opted-out
                                </Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1 font-mono">
                                <Phone size={13} className="text-slate-400" />
                                {customer.phone}
                            </span>
                            {customer.email && (
                                <span className="flex items-center gap-1">
                                    <Mail size={13} className="text-slate-400" />
                                    {customer.email}
                                </span>
                            )}
                            {customer.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={13} className="text-slate-400" />
                                    {customer.city}{customer.state ? `, ${customer.state}` : ""}{customer.country ? ` (${customer.country})` : ""}
                                </span>
                            )}
                            {customer.company && (
                                <span className="flex items-center gap-1">
                                    <Building2 size={13} className="text-slate-400" />
                                    {customer.company}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab("conversations")}
                        className="text-xs rounded-xl font-semibold gap-1.5 h-9"
                    >
                        <MessageCircle size={14} className="text-[#35877D]" />
                        Open Chat
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2.5 border-b-2 transition-all ${
                        activeTab === "overview"
                            ? "border-[#35877D] text-[#35877D]"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab("conversations")}
                    className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === "conversations"
                            ? "border-[#35877D] text-[#35877D]"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    <span>Conversations</span>
                    {customer.messageCount > 0 && (
                        <Badge className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0 h-4 rounded-full">
                            {customer.messageCount}
                        </Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("campaigns")}
                    className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                        activeTab === "campaigns"
                            ? "border-[#35877D] text-[#35877D]"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    <span>Campaigns Received</span>
                    {customer.campaigns?.length > 0 && (
                        <Badge className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0 h-4 rounded-full">
                            {customer.campaigns.length}
                        </Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-4 py-2.5 border-b-2 transition-all ${
                        activeTab === "notes"
                            ? "border-[#35877D] text-[#35877D]"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Notes & CRM
                </button>
                <button
                    onClick={() => setActiveTab("activity")}
                    className={`px-4 py-2.5 border-b-2 transition-all ${
                        activeTab === "activity"
                            ? "border-[#35877D] text-[#35877D]"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                    Timeline & History
                </button>
            </div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Contact Attributes */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold text-slate-900">
                                    Customer Profile Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-400 font-medium">First Name:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">{customer.first_name || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Last Name:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">{customer.last_name || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Phone Number (E.164):</span>
                                    <div className="font-semibold text-slate-800 font-mono mt-0.5">{customer.phone}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Email:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">{customer.email || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Company:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">{customer.company || "—"}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Lead Source:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">{customer.source || "Direct"}</div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">City & State:</span>
                                    <div className="font-semibold text-slate-800 mt-0.5">
                                        {[customer.city, customer.state, customer.country].filter(Boolean).join(", ") || "—"}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-400 font-medium">Pipeline Stage:</span>
                                    <div className="mt-1">
                                        <StageBadge stage={(customer.stage as StageKey) || "new_lead"} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Custom Attributes */}
                        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-slate-900">
                                    Custom Attributes
                                </CardTitle>
                                <span className="text-xs text-slate-400">
                                    {Object.keys(customer.custom_attributes || {}).length} configured
                                </span>
                            </CardHeader>
                            <CardContent className="p-5">
                                {Object.keys(customer.custom_attributes || {}).length === 0 ? (
                                    <div className="text-xs text-slate-400 italic">
                                        No custom attributes assigned to this contact.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.entries(customer.custom_attributes).map(([key, val]) => (
                                            <div key={key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                                <div className="text-[10px] text-slate-400 font-semibold uppercase">{key}</div>
                                                <div className="font-bold text-slate-800 mt-0.5">{String(val)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: WhatsApp Marketing & Engagement Status */}
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold text-slate-900">
                                    WhatsApp Marketing Permission
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Opt-in Status:</span>
                                    {customer.whatsapp_opt_in ? (
                                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold">
                                            Opted-In (Active)
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-rose-600 border-rose-200 font-semibold">
                                            Opted-Out
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Opt-in Timestamp:</span>
                                    <span className="font-medium text-slate-700">
                                        {customer.whatsapp_opt_in_at
                                            ? new Date(customer.whatsapp_opt_in_at).toLocaleDateString()
                                            : "Automatic default"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Campaign Eligibility:</span>
                                    <span className="font-bold text-emerald-700">Eligible to receive broadcasts</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                            <CardHeader className="p-5 pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold text-slate-900">
                                    Engagement Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Inbox Conversations:</span>
                                    <span className="font-bold text-slate-800">{customer.messageCount ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Campaigns Delivered:</span>
                                    <span className="font-bold text-slate-800">{customer.campaigns?.length ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500">Created:</span>
                                    <span className="font-medium text-slate-600">
                                        {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: 2. CONVERSATIONS */}
            {activeTab === "conversations" && (
                <Card className="h-[650px] overflow-hidden flex flex-col rounded-2xl border-slate-200/90 shadow-xs bg-white">
                    <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <MessageCircle size={16} className="text-[#35877D]" />
                            WhatsApp Conversation History
                        </CardTitle>
                        <span className="text-xs text-slate-500">
                            Customer Service Window / Session
                        </span>
                    </CardHeader>

                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {isLoadingConversations ? (
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                                        <Skeleton className="h-16 w-[50%] rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : !conversations || conversations.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                <MessageCircle size={32} className="opacity-30" />
                                <p className="text-xs">No prior conversation history recorded.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-4">
                                {conversations
                                    .filter((c: any) => c.type !== "reaction" && c.message !== "Received Reaction message")
                                    .map((conv: any) => {
                                        const isInbound = conv.direction === "inbound";
                                        return (
                                            <div key={conv.id} className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}>
                                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                                    {isInbound && <span className="text-xs font-bold text-slate-700">{customer.name || "Customer"}</span>}
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(conv.createdAt).toLocaleString("en-IN", {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                    {!isInbound && <span className="text-xs font-semibold text-[#35877D]">You</span>}
                                                </div>

                                                <div className="relative inline-block max-w-[75%]">
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap break-words ${
                                                            isInbound
                                                                ? "bg-slate-100 text-slate-900 rounded-tl-xs"
                                                                : "bg-[#35877D] text-white rounded-tr-xs shadow-xs"
                                                        }`}
                                                    >
                                                        {conv.message}
                                                    </div>

                                                    {Array.isArray(conv.reactions) && conv.reactions.length > 0 && (() => {
                                                        const grouped = groupReactions(conv.reactions);
                                                        if (grouped.length === 0) return null;
                                                        return (
                                                            <div className={`absolute -bottom-2.5 flex items-center gap-1 z-10 ${isInbound ? "right-2" : "left-2"}`}>
                                                                {grouped.map((gr) => (
                                                                    <span
                                                                        key={gr.emoji}
                                                                        className="inline-flex items-center gap-1 bg-white border border-slate-200 shadow-2xs rounded-full px-1.5 py-0.5 text-xs select-none"
                                                                    >
                                                                        <span>{gr.emoji}</span>
                                                                        {gr.count > 1 && <span className="text-[10px] font-bold text-slate-600">{gr.count}</span>}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Chat Input Form */}
                    <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder={`Type a WhatsApp message to ${customer.name || customer.phone}...`}
                                    className="min-h-[44px] max-h-[120px] resize-none py-2.5 text-xs rounded-xl"
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                            </div>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={isSending || !messageText.trim()}
                                className="h-[44px] w-[44px] shrink-0 bg-[#35877D] hover:bg-[#2d736a] text-white rounded-xl"
                            >
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* TAB CONTENT: 3. CAMPAIGNS RECEIVED */}
            {activeTab === "campaigns" && (
                <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
                    <CardHeader className="p-5 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-900">
                            Broadcast Campaigns Sent to This Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {!customer.campaigns || customer.campaigns.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-xs">
                                No broadcast campaigns delivered to this customer yet.
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-3.5 pl-5">Campaign Name</th>
                                        <th className="p-3.5">Delivery Status</th>
                                        <th className="p-3.5">Sent At</th>
                                        <th className="p-3.5">Read At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customer.campaigns.map((camp: any) => (
                                        <tr key={camp.id} className="hover:bg-slate-50/50">
                                            <td className="p-3.5 pl-5 font-bold text-slate-800">{camp.name}</td>
                                            <td className="p-3.5">
                                                <Badge
                                                    className={`text-[10px] font-semibold ${
                                                        camp.status === "read"
                                                            ? "bg-teal-50 text-teal-800 border-teal-200"
                                                            : camp.status === "delivered"
                                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                                            : "bg-slate-100 text-slate-700"
                                                    }`}
                                                >
                                                    {camp.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                                                {camp.sent_at ? new Date(camp.sent_at).toLocaleString() : "—"}
                                            </td>
                                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                                                {camp.read_at ? new Date(camp.read_at).toLocaleString() : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: 4. NOTES */}
            {activeTab === "notes" && (
                <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                    <CardHeader className="p-5 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-900">
                            Internal Contact Notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <Textarea
                            rows={6}
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about customer preferences, deals, meetings, or WhatsApp requirements..."
                            className="text-xs rounded-xl"
                        />
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                disabled={isSavingNotes}
                                onClick={handleSaveNotes}
                                className="bg-[#35877D] hover:bg-[#2d736a] text-white text-xs font-semibold gap-1.5 shadow-sm"
                            >
                                {isSavingNotes && <Loader2 size={13} className="animate-spin" />}
                                Save Notes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* TAB CONTENT: 5. ACTIVITY TIMELINE */}
            {activeTab === "activity" && (
                <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white">
                    <CardHeader className="p-5 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-900">
                            Activity Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-teal-50 text-[#35877D] flex items-center justify-center shrink-0">
                                <CheckCircle2 size={15} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">Contact Record Created</div>
                                <div className="text-[11px] text-slate-400">
                                    {customer.createdAt ? new Date(customer.createdAt).toLocaleString() : "—"} via {customer.source || "System"}
                                </div>
                            </div>
                        </div>

                        {customer.whatsapp_opt_in && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <ShieldCheck size={15} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">WhatsApp Marketing Permission Confirmed</div>
                                    <div className="text-[11px] text-slate-400">
                                        Opt-in active for broadcast campaigns
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
