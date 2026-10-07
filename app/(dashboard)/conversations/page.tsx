"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    useListConversations,
    useGetCustomerConversations,
    useSendMessage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/components/notifications/NotificationRealtimeProvider";
import { useAuth } from "@/lib/auth-context";
import {
    Search,
    User,
    MessageSquare,
    Settings,
    SlidersHorizontal,
    Plus,
    ChevronDown,
    ChevronRight,
    Phone,
    MoreVertical,
    Send,
    Bot,
    Clock,
    Zap,
    BookOpen,
    Smile,
    Paperclip,
    Mic,
    CheckCheck,
    Loader2,
    Bell,
    ArrowDown
} from "lucide-react";

function ConversationsContent() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { token, user } = useAuth();
    const {
        connectionStatus,
        activeCustomerId,
        setActiveCustomerId,
        browserPermission,
        requestBrowserPermission,
        isSupported
    } = useRealtime();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTab, setSelectedTab] = useState("all"); // all, open, unread, pending
    const [replyText, setReplyText] = useState("");
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    // Sync active customer from URL query param if present
    useEffect(() => {
        const paramId = searchParams.get("customer_id") || searchParams.get("conversation");
        if (paramId && !isNaN(Number(paramId))) {
            setActiveCustomerId(Number(paramId));
        }
    }, [searchParams, setActiveCustomerId]);

    // Fetch conversation messages
    const { data: conversations, isLoading: isLoadingAll } = useListConversations();

    // Grouping all messages by customer to create chat list threads
    const chatThreads = useMemo(() => {
        if (!conversations) return [];

        const groups: Record<number, {
            customerId: number;
            customerName: string;
            customerPhone: string;
            lastMessage: string;
            lastMessageDirection: "inbound" | "outbound";
            lastMessageTime: string;
            unreadCount: number;
            intent?: string;
        }> = {};

        // Sort descending to process newest messages first
        const sortedConvs = [...conversations].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        sortedConvs.forEach((conv) => {
            const cid = conv.customerId;
            if (!groups[cid]) {
                groups[cid] = {
                    customerId: cid,
                    customerName: conv.customerName || conv.customerPhone || "WhatsApp User",
                    customerPhone: conv.customerPhone || "",
                    lastMessage: conv.message,
                    lastMessageDirection: conv.direction,
                    lastMessageTime: conv.createdAt,
                    unreadCount: 0,
                    intent: conv.intent,
                };
            }
            if (conv.direction === "inbound" && conv.isRead === 0) {
                groups[cid].unreadCount += 1;
            }
        });

        return Object.values(groups);
    }, [conversations]);

    // Filtering active chat list threads
    const filteredThreads = useMemo(() => {
        return chatThreads.filter((thread) => {
            const matchesSearch =
                thread.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                thread.customerPhone.includes(searchQuery) ||
                thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (selectedTab === "unread") {
                return thread.unreadCount > 0 || thread.lastMessageDirection === "inbound";
            }
            if (selectedTab === "pending") {
                return !!thread.intent;
            }
            return true;
        });
    }, [chatThreads, searchQuery, selectedTab]);

    // Auto-select first thread if nothing active
    useEffect(() => {
        if (activeCustomerId === null && filteredThreads.length > 0) {
            setActiveCustomerId(filteredThreads[0].customerId);
        }
    }, [filteredThreads, activeCustomerId, setActiveCustomerId]);

    // Retrieve active customer thread
    const { data: activeConversations, isLoading: isLoadingThread } = useGetCustomerConversations(
        activeCustomerId || 0,
        { query: { queryKey: ["getCustomerConversations", activeCustomerId], enabled: !!activeCustomerId } }
    );

    const activeThread = useMemo(() => {
        return chatThreads.find((t) => t.customerId === activeCustomerId);
    }, [chatThreads, activeCustomerId]);

    // Sort messages in chronological order (oldest at the top, newest at the bottom)
    const sortedConversations = useMemo(() => {
        if (!activeConversations) return [];
        return [...activeConversations].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [activeConversations]);

    // Handle scroll position and new message alert pill
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        isAtBottomRef.current = atBottom;
        if (atBottom) {
            setHasUnreadBelow(false);
        }
    };

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        setHasUnreadBelow(false);
        isAtBottomRef.current = true;
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom(false);
        } else {
            setHasUnreadBelow(true);
        }
    }, [sortedConversations.length]);

    // Outbound composer send with optimistic UI update
    const sendMessage = useSendMessage();
    const isSending = sendMessage.isPending;

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !activeCustomerId || !activeThread) return;

        const outgoingBody = replyText.trim();
        const tempId = Date.now();
        const tempMsg = {
            id: tempId,
            customerId: activeCustomerId,
            customerName: activeThread.customerName,
            customerPhone: activeThread.customerPhone,
            message: outgoingBody,
            direction: "outbound" as const,
            status: "pending",
            isRead: 1,
            createdAt: new Date().toISOString(),
        };

        // Optimistically insert into active conversation cache
        queryClient.setQueryData(
            ["getCustomerConversations", activeCustomerId],
            (old: any[] | undefined) => [...(old || []), tempMsg]
        );

        setReplyText("");
        setTimeout(() => scrollToBottom(true), 50);

        try {
            await sendMessage.mutateAsync({
                data: {
                    to: activeThread.customerPhone,
                    body: outgoingBody,
                }
            });

            toast({ title: "Reply Sent", description: "Outbound message dispatched successfully." });

            // Reconcile and refresh active thread queries
            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
            // Remove optimistic item on failure
            queryClient.setQueryData(
                ["getCustomerConversations", activeCustomerId],
                (old: any[] | undefined) => (old || []).filter((m) => m.id !== tempId)
            );
            toast({
                title: "Failed to send",
                description: err.message || "Could not dispatch reply",
                variant: "destructive"
            });
        }
    };

    // Mark as read when selecting a thread
    const handleSelectThread = (cid: number) => {
        setActiveCustomerId(cid);
        if (token) {
            fetch(`/api/conversations/${cid}/read`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    ...(user?.tenant_id ? { "X-Tenant-Id": String(user.tenant_id) } : {}),
                },
            }).catch(() => {});
        }
    };

    return (
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-800 font-sans antialiased">
            {/* COLUMN 1: CONVERSATION LIST (SIDEBAR) */}
            <div className="w-76 shrink-0 border-r border-slate-200 flex flex-col bg-white">
                {/* Search & Header */}
                <div className="p-3 border-b border-slate-150 shrink-0 bg-white">
                    {/* Filter Pills */}
                    <div className="flex gap-1.5 w-full">
                        {["all", "open", "unread", "pending"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`text-[10px] font-bold py-1 rounded-full border transition-all cursor-pointer uppercase tracking-wider flex-1 text-center ${selectedTab === tab
                                    ? "bg-[#378179] text-white border-transparent"
                                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search box */}
                <div className="px-3.5 py-2 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search active chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 text-xs h-8.5 rounded-lg bg-slate-50 border-slate-200 focus:bg-white text-slate-800 placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-[#378179] focus-visible:ring-offset-0"
                        />
                    </div>
                </div>

                {/* Chats Thread List */}
                <div className="flex-1 overflow-auto bg-white">
                    <div className="px-3.5 py-2 text-[11px] font-semibold text-slate-500 tracking-wide bg-slate-50 border-b border-slate-100 uppercase flex items-center justify-between">
                        <span>Today</span>
                        {browserPermission === "default" && isSupported && (
                            <button
                                onClick={requestBrowserPermission}
                                className="text-[10px] font-semibold text-[#378179] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Enable browser alerts for new messages"
                            >
                                <Bell size={10} />
                                Alerts
                            </button>
                        )}
                    </div>
                    <div className="divide-y divide-slate-100">
                        {isLoadingAll ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="p-4 space-y-2">
                                    <div className="flex justify-between"><Skeleton className="h-4.5 w-24 rounded" /><Skeleton className="h-3.5 w-8 rounded" /></div>
                                    <Skeleton className="h-3.5 w-full rounded" />
                                </div>
                            ))
                        ) : filteredThreads.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                                <MessageSquare className="mx-auto text-slate-200" size={24} />
                                <p>No active chats found</p>
                            </div>
                        ) : (
                            filteredThreads.map((thread) => {
                                const isSelected = thread.customerId === activeCustomerId;
                                return (
                                    <button
                                        key={thread.customerId}
                                        onClick={() => handleSelectThread(thread.customerId)}
                                        className={`w-full text-left p-3.5 flex gap-3 transition-all text-xs border-l-[4px] cursor-pointer relative ${isSelected
                                            ? "bg-[#f2faf7] border-[#378179]"
                                            : "border-transparent hover:bg-slate-50 bg-white"
                                            }`}
                                    >
                                        {/* User Avatar with WhatsApp Badge */}
                                        <div className="relative shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-[#378179]/10 text-[#378179] flex items-center justify-center font-bold text-sm">
                                                {thread.customerName.charAt(0).toUpperCase()}
                                            </div>
                                            {thread.unreadCount > 0 && !isSelected && (
                                                <span className="absolute -top-1 -right-1 bg-[#378179] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-xs">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                                                    {thread.customerName}
                                                    {thread.lastMessageDirection === "outbound" && (
                                                        <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400 font-normal">
                                                            <Bot size={11} className="text-[#378179]/70 shrink-0" />
                                                            Bot
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[11px] text-slate-400 shrink-0 ml-1.5 font-medium">
                                                    {new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 truncate text-[12px] leading-relaxed mt-0.5">
                                                {thread.lastMessage}
                                            </p>

                                            <div className="flex items-center justify-between pt-1.5">
                                                <span className="text-[11px] font-semibold text-[#378179] bg-[#378179]/10 px-2 py-0.5 rounded border border-[#378179]/15">
                                                    Open
                                                </span>
                                                {thread.unreadCount > 0 && !isSelected && (
                                                    <span className="text-[10px] font-semibold text-[#378179]">
                                                        {thread.unreadCount} unread
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* COLUMN 2: RIGHT PANEL (CHAT THREAD & COMPOSER) */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC]/50 relative">
                {activeThread ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700">
                                    {activeThread.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        <span>{activeThread.customerName}</span>
                                        {activeThread.customerPhone && (
                                            <span className="text-xs text-slate-400 font-normal">
                                                ({activeThread.customerPhone})
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                                        <Bot size={11} className="text-[#378179]" />
                                        Bot Available
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-400">
                                {/* Subtle Live Realtime Status Pill */}
                                <div className="flex items-center text-[11px] font-medium mr-1">
                                    {connectionStatus === "connected" ? (
                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 text-xs font-semibold">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live
                                        </span>
                                    ) : connectionStatus === "connecting" || connectionStatus === "reconnecting" ? (
                                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-xs font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                            Connecting
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 text-xs font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            Syncing
                                        </span>
                                    )}
                                </div>

                                <Badge className="bg-[#378179]/10 text-[#378179] hover:bg-[#378179]/15 border border-[#378179]/15 font-semibold text-xs px-2.5 py-0.5 rounded-lg">
                                    Open
                                </Badge>
                                <div className="h-4 w-px bg-slate-200" />
                                <MoreVertical size={14} className="hover:text-slate-600 cursor-pointer" />
                            </div>
                        </div>

                        {/* Thread message bubble body scroll */}
                        <div
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-auto p-4 space-y-4 relative"
                        >
                            {isLoadingThread ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-1/3 rounded-xl" />
                                    <Skeleton className="h-14 w-1/2 rounded-xl ml-auto bg-[#EAF7F2]/40" />
                                    <Skeleton className="h-10 w-2/5 rounded-xl" />
                                </div>
                            ) : sortedConversations.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                    No message logs found.
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {/* Mock initialization system log */}
                                    <div className="flex justify-center text-xs text-slate-500 font-medium py-1">
                                        <span className="bg-slate-100/80 px-3 py-1 rounded-full shadow-2xs">
                                            The chat has been initialized by contact {activeThread.customerName} ({activeThread.customerPhone})
                                        </span>
                                    </div>

                                    {sortedConversations.map((conv, idx) => {
                                        const isInbound = conv.direction === "inbound";

                                        // Simple date check
                                        const showDate = idx === 0 ||
                                            new Date(conv.createdAt).toDateString() !== new Date(sortedConversations[idx - 1].createdAt).toDateString();

                                        return (
                                            <div key={conv.id || `temp-${idx}`} className="space-y-3">
                                                {showDate && (
                                                    <div className="flex justify-center py-2 shrink-0">
                                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                            {new Date(conv.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* System notification log for automations */}
                                                {conv.intent === "automation_reply" && (
                                                    <div className="flex justify-center text-xs text-slate-400 font-medium py-1">
                                                        <span className="bg-slate-100 px-3 py-1 rounded-full shadow-2xs">
                                                            The ticket status has been set as Open by agent Bot
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                                                    <div className={`flex flex-col max-w-[75%] ${isInbound ? "items-start" : "items-end"}`}>
                                                        {/* Bubble wrapper */}
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-all border ${isInbound
                                                            ? "bg-white text-slate-800 border-slate-200/80 rounded-tl-xs shadow-xs"
                                                            : "bg-[#eef6f5] text-slate-800 border-[#d3e8e5] rounded-tr-xs shadow-xs"
                                                            }`}>
                                                            {conv.message}
                                                        </div>

                                                        {/* Footer info inside bubbles */}
                                                        <div className="flex items-center gap-1.5 mt-1.5 px-1 text-[11px] font-normal text-slate-700">
                                                            {isInbound && <span className="text-[#378179] font-medium">{activeThread.customerName}</span>}
                                                            <span>
                                                                {new Date(conv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {!isInbound && (
                                                                <span className="flex items-center gap-1 text-[#378179]">
                                                                    {conv.intent === "automation_reply" || conv.intent === "ai" ? "Bot" : "Sent"}
                                                                    {(conv as any).status === "read" ? (
                                                                        <CheckCheck size={12} className="text-[#34b7f1]" />
                                                                    ) : (conv as any).status === "delivered" ? (
                                                                        <CheckCheck size={12} className="text-[#378179]" />
                                                                    ) : (conv as any).status === "sent" ? (
                                                                        <CheckCheck size={12} className="text-slate-400" />
                                                                    ) : (conv as any).status === "failed" ? (
                                                                        <span className="text-rose-500 font-semibold text-[10px]">Failed</span>
                                                                    ) : (
                                                                        <Clock size={11} className="text-slate-400" />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}

                            {/* Floating New Message indicator pill if scrolled up */}
                            {hasUnreadBelow && (
                                <button
                                    onClick={() => scrollToBottom(true)}
                                    className="sticky bottom-3 left-1/2 -translate-x-1/2 bg-[#378179] hover:bg-[#2b625c] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20 cursor-pointer transition-all animate-bounce"
                                >
                                    <span>New message</span>
                                    <ArrowDown size={13} />
                                </button>
                            )}
                        </div>

                        {/* Composer Chat Input area */}
                        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                            <form onSubmit={handleSendReply} className="space-y-2.5">
                                <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your message here or press '/' key for templates..."
                                    className="min-h-[48px] max-h-[120px] text-sm resize-none py-2.5 px-3 border-transparent focus-visible:ring-0 rounded-lg bg-slate-50 focus:bg-white"
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply(e);
                                        }
                                    }}
                                />

                                <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                                    {/* Action toolbar buttons */}
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                        <Button type="button" size="sm" className="bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs h-7 px-3.5 rounded-lg border-0 shadow-xs flex items-center gap-1 cursor-pointer">
                                            Copilot
                                            <ChevronDown size={11} />
                                        </Button>
                                        <button type="button" className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"><BookOpen size={14} /></button>
                                        <button type="button" className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"><Smile size={14} /></button>
                                        <button type="button" className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"><Paperclip size={14} /></button>
                                        <button type="button" className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer"><Mic size={14} /></button>
                                    </div>

                                    {/* Send Trigger */}
                                    <Button
                                        type="submit"
                                        disabled={isSending || !replyText.trim()}
                                        className="bg-[#378179] hover:bg-[#2b625c] text-white font-semibold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs border-0 cursor-pointer"
                                    >
                                        {isSending ? (
                                            <Loader2 className="animate-spin" size={13} />
                                        ) : (
                                            <>
                                                <Send size={13} />
                                                Send
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center space-y-4">
                        <div className="text-[#378179] opacity-90">
                            {/* Double speech bubble SVG outlines */}
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm">No conversation selected</h4>
                        <p className="max-w-xs leading-normal text-slate-500 text-xs">Select a chat from the list</p>
                        <button
                            onClick={() => setSelectedTab("unread")}
                            className="mt-2 px-4 py-2 border border-[#378179] text-[#378179] rounded-lg text-xs font-semibold hover:bg-[#378179]/05 transition-colors cursor-pointer"
                        >
                            View Unread Chats
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ConversationsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-full w-full bg-white p-6 items-center justify-center">
                <Loader2 className="animate-spin text-[#378179]" size={24} />
            </div>
        }>
            <ConversationsContent />
        </Suspense>
    );
}
