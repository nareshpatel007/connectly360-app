"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    useListConversations,
    useGetCustomerConversations,
    useSendMessage,
    useGetConversationCounts,
    useGetInboxSettings,
    useGetWindowStatus,
    type Conversation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/components/notifications/NotificationRealtimeProvider";
import { useAuth } from "@/lib/auth-context";
import {
    formatMessageDateSeparator,
    formatConversationListTimestamp,
    formatMessageTime,
} from "@/lib/date-utils";
import { NewConversationModal } from "@/components/conversations/NewConversationModal";
import { ConversationStatusDropdown } from "@/components/conversations/ConversationStatusDropdown";
import { ConversationAssigneeDropdown } from "@/components/conversations/ConversationAssigneeDropdown";
import { ConversationHeaderMenu } from "@/components/conversations/ConversationHeaderMenu";
import { CopilotDropdown } from "@/components/conversations/CopilotDropdown";
import { QuickReplyPicker } from "@/components/conversations/QuickReplyPicker";
import { TemplatePickerModal } from "@/components/conversations/TemplatePickerModal";
import {
    Search,
    User,
    MessageSquare,
    Plus,
    Phone,
    Send,
    Bot,
    Clock,
    BookOpen,
    Smile,
    Paperclip,
    Mic,
    CheckCheck,
    Loader2,
    Bell,
    ArrowDown,
    ArrowLeft,
    ShieldAlert,
    UserCheck,
    Sparkles,
    CheckCircle2,
    X,
} from "lucide-react";

function ConversationsContent() {
    const router = useRouter();
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

    // URL State management
    const urlStatus = searchParams.get("status") || "all";
    const [selectedTab, setSelectedTab] = useState(urlStatus); // all, open, pending, resolved, unread
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [replyText, setReplyText] = useState("");
    const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

    // Modals
    const [isNewConvOpen, setIsNewConvOpen] = useState(false);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

    // Mobile Master-Detail toggle
    const [showMobileList, setShowMobileList] = useState(true);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef(true);

    // Debounce search query
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 250);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Synchronize tab with URL
    const handleTabChange = (newTab: string) => {
        setSelectedTab(newTab);
        const params = new URLSearchParams(searchParams.toString());
        if (newTab === "all") {
            params.delete("status");
        } else {
            params.set("status", newTab);
        }
        router.replace(`/conversations?${params.toString()}`);
    };

    // Synchronize active customer from URL query param if present
    useEffect(() => {
        const paramId = searchParams.get("customer_id") || searchParams.get("conversation");
        if (paramId && !isNaN(Number(paramId))) {
            const numId = Number(paramId);
            setActiveCustomerId(numId);
            setShowMobileList(false);
        }
    }, [searchParams, setActiveCustomerId]);

    // Fetch conversation dynamic counts
    const { data: countsData } = useGetConversationCounts();
    const counts = countsData?.counts || { all: 0, open: 0, pending: 0, resolved: 0, unread: 0 };

    // Fetch inbox configuration settings
    const { data: settingsData } = useGetInboxSettings();
    const inboxConfig = settingsData?.settings;
    const composerSettings = inboxConfig?.composer || {
        ai_copilot: true,
        templates: true,
        emoji: true,
        attachments: true,
        image: true,
        video: true,
        document: true,
        audio: false,
        quick_replies: true,
    };

    // Fetch conversation thread list
    const { data: conversations, isLoading: isLoadingAll } = useListConversations({
        status: selectedTab,
        search: debouncedSearch,
    });

    // Chat threads list
    const chatThreads = useMemo(() => {
        if (!conversations) return [];
        return conversations;
    }, [conversations]);

    // Filtered threads
    const filteredThreads = useMemo(() => {
        return chatThreads;
    }, [chatThreads]);

    // Auto-select first thread if none active on desktop
    useEffect(() => {
        if (activeCustomerId === null && filteredThreads.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
            setActiveCustomerId(filteredThreads[0].customerId);
        }
    }, [filteredThreads, activeCustomerId, setActiveCustomerId]);

    // Retrieve active customer messages
    const { data: activeConversations, isLoading: isLoadingThread } = useGetCustomerConversations(
        activeCustomerId || 0,
        { query: { queryKey: ["getCustomerConversations", activeCustomerId], enabled: !!activeCustomerId } }
    );

    const activeThread = useMemo(() => {
        return chatThreads.find((t) => t.customerId === activeCustomerId);
    }, [chatThreads, activeCustomerId]);

    // Check 24-hour window status for active customer
    const { data: windowStatus } = useGetWindowStatus(activeCustomerId);
    const isOutside24hWindow = activeThread?.isInside24hWindow === false || windowStatus?.inside_window === false;

    // Chronologically sorted messages
    const sortedConversations = useMemo(() => {
        if (!activeConversations) return [];
        return [...activeConversations].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [activeConversations]);

    // Group messages by localized date header
    const groupedMessages = useMemo(() => {
        const groups: { dateLabel: string; messages: any[] }[] = [];
        let currentDateLabel = "";
        let currentGroup: any[] = [];

        sortedConversations.forEach((msg) => {
            const dateLabel = formatMessageDateSeparator(msg.createdAt);
            if (dateLabel !== currentDateLabel) {
                if (currentGroup.length > 0) {
                    groups.push({ dateLabel: currentDateLabel, messages: currentGroup });
                }
                currentDateLabel = dateLabel;
                currentGroup = [msg];
            } else {
                currentGroup.push(msg);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ dateLabel: currentDateLabel, messages: currentGroup });
        }

        return groups;
    }, [sortedConversations]);

    // Scroll helpers
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

    // Outbound composer send
    const sendMessage = useSendMessage();
    const isSending = sendMessage.isPending;

    const handleSendReply = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!replyText.trim() || !activeCustomerId || !activeThread) return;

        // If outside 24-hour window, WhatsApp requires template!
        if (isOutside24hWindow) {
            toast({
                title: "Template Required",
                description: "Customer is outside the 24-hour service window. Please select an approved template.",
                variant: "destructive",
            });
            setIsTemplatePickerOpen(true);
            return;
        }

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

            queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
            queryClient.invalidateQueries({ queryKey: ["listConversations"] });
        } catch (err: any) {
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

    // Selecting a conversation thread
    const handleSelectThread = (cid: number) => {
        setActiveCustomerId(cid);
        setShowMobileList(false);

        // Update URL query param smoothly
        const params = new URLSearchParams(searchParams.toString());
        params.set("customer_id", String(cid));
        router.replace(`/conversations?${params.toString()}`);

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
        <div className="flex h-full w-full bg-white overflow-hidden text-slate-800 font-sans antialiased relative">
            {/* COLUMN 1: CONVERSATION LIST (SIDEBAR) */}
            <div
                className={`w-full md:w-80 shrink-0 border-r border-slate-200 flex flex-col bg-white z-10 transition-all ${
                    showMobileList ? "flex" : "hidden md:flex"
                }`}
            >
                {/* Header & New Conversation Action */}
                <div className="p-3 border-b border-slate-150 shrink-0 bg-white space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">Inbox</h2>
                            {counts.unread > 0 && (
                                <span className="bg-[#378179] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs">
                                    {counts.unread}
                                </span>
                            )}
                        </div>

                        {/* + New Conversation Button */}
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsNewConvOpen(true)}
                            className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs h-7.5 px-2.5 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                            <Plus size={13} strokeWidth={2.5} />
                            <span>New Message</span>
                        </Button>
                    </div>

                    {/* Filter Pills with Dynamic Counts */}
                    <div className="flex gap-1 w-full overflow-x-auto pb-0.5 no-scrollbar">
                        {[
                            { key: "all", label: "All", count: counts.all },
                            { key: "open", label: "Open", count: counts.open },
                            { key: "pending", label: "Pending", count: counts.pending },
                            { key: "resolved", label: "Resolved", count: counts.resolved },
                            { key: "unread", label: "Unread", count: counts.unread },
                        ].map((tabItem) => (
                            <button
                                key={tabItem.key}
                                onClick={() => handleTabChange(tabItem.key)}
                                className={`text-[10px] font-bold py-1 px-2 rounded-full border transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center gap-1 shrink-0 ${
                                    selectedTab === tabItem.key
                                        ? "bg-[#378179] text-white border-transparent shadow-xs"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <span>{tabItem.label}</span>
                                {tabItem.count !== undefined && (
                                    <span
                                        className={`text-[9px] px-1 rounded-full font-bold ${
                                            selectedTab === tabItem.key ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {tabItem.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Box */}
                <div className="px-3 py-2 border-b border-slate-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Search active chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 text-xs h-8.5 rounded-lg bg-slate-50 border-slate-200 focus:bg-white text-slate-800 placeholder-slate-400 focus-visible:ring-1 focus-visible:ring-[#378179] focus-visible:ring-offset-0"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Chats Thread List */}
                <div className="flex-1 overflow-auto bg-white">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-500 tracking-wider bg-slate-50 border-b border-slate-100 uppercase flex items-center justify-between">
                        <span>Conversations</span>
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
                                <div key={i} className="p-3.5 space-y-2">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-28 rounded" />
                                        <Skeleton className="h-3 w-10 rounded" />
                                    </div>
                                    <Skeleton className="h-3.5 w-full rounded" />
                                </div>
                            ))
                        ) : filteredThreads.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 space-y-3">
                                <MessageSquare className="mx-auto text-slate-200" size={32} />
                                <div className="space-y-1">
                                    <p className="font-bold text-slate-700">No conversations found</p>
                                    <p className="text-[11px] text-slate-400">
                                        {searchQuery ? "Try a different search term" : "Start a new conversation with a customer"}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsNewConvOpen(true)}
                                    className="text-xs border-[#378179] text-[#378179] hover:bg-[#378179]/05 rounded-lg h-7.5"
                                >
                                    <Plus size={12} className="mr-1" /> New Conversation
                                </Button>
                            </div>
                        ) : (
                            filteredThreads.map((thread) => {
                                const isSelected = thread.customerId === activeCustomerId;
                                const threadStatus = thread.conversationStatus || thread.status || "open";

                                return (
                                    <button
                                        key={thread.customerId}
                                        onClick={() => handleSelectThread(thread.customerId)}
                                        className={`w-full text-left p-3 flex gap-3 transition-all text-xs border-l-[3.5px] cursor-pointer relative ${
                                            isSelected
                                                ? "bg-[#f2faf7] border-[#378179]"
                                                : "border-transparent hover:bg-slate-50 bg-white"
                                        }`}
                                    >
                                        {/* Avatar with unread badge */}
                                        <div className="relative shrink-0">
                                            <div className="h-9.5 w-9.5 rounded-full bg-[#378179]/10 text-[#378179] flex items-center justify-center font-bold text-xs">
                                                {thread.customerName ? thread.customerName.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            {(thread.unreadCount ?? 0) > 0 && !isSelected && (
                                                <span className="absolute -top-1 -right-1 bg-[#378179] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-xs">
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-800 text-xs truncate flex items-center gap-1.5">
                                                    {thread.customerName || thread.customerPhone}
                                                    {thread.lastMessageDirection === "outbound" && (
                                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-normal">
                                                            <Bot size={10} className="text-[#378179]/70 shrink-0" />
                                                            Bot
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-slate-400 shrink-0 ml-1 font-medium">
                                                    {formatConversationListTimestamp(thread.lastMessageTime || thread.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 truncate text-[11px] leading-relaxed">
                                                {thread.lastMessage || "No messages yet"}
                                            </p>

                                            <div className="flex items-center justify-between pt-1">
                                                {/* Status indicator */}
                                                <span
                                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                                        threadStatus === "open"
                                                            ? "bg-[#378179]/10 text-[#378179]"
                                                            : threadStatus === "pending"
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "bg-slate-100 text-slate-600"
                                                    }`}
                                                >
                                                    {threadStatus}
                                                </span>

                                                {(thread.unreadCount ?? 0) > 0 && !isSelected && (
                                                    <span className="text-[9px] font-bold text-[#378179]">
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
            <div
                className={`flex-1 flex flex-col bg-[#F8FAFC]/50 relative transition-all ${
                    !showMobileList ? "flex" : "hidden md:flex"
                }`}
            >
                {activeThread ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                {/* Mobile Back Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowMobileList(true)}
                                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                >
                                    <ArrowLeft size={16} />
                                </button>

                                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {activeThread.customerName ? activeThread.customerName.charAt(0).toUpperCase() : "C"}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                        <span className="truncate">{activeThread.customerName}</span>
                                        {activeThread.customerPhone && (
                                            <span className="text-[11px] text-slate-400 font-normal shrink-0">
                                                (+{activeThread.customerPhone})
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                        <Bot size={11} className="text-[#378179]" />
                                        Bot Available
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 shrink-0">
                                {/* Live Realtime Status Pill */}
                                <div className="hidden sm:flex items-center text-[10px] font-medium mr-1">
                                    {connectionStatus === "connected" ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-bold">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Live
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-medium">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            Syncing
                                        </span>
                                    )}
                                </div>

                                {/* Assignee Dropdown */}
                                <ConversationAssigneeDropdown
                                    customerId={activeThread.customerId}
                                    currentAssigneeId={activeThread.assignedTo}
                                    currentAssigneeName={activeThread.assignee?.name}
                                />

                                {/* Interactive Status Dropdown (Open / Pending / Resolved) */}
                                <ConversationStatusDropdown
                                    customerId={activeThread.customerId}
                                    currentStatus={activeThread.conversationStatus || activeThread.status || "open"}
                                />

                                <div className="h-4 w-px bg-slate-200" />

                                {/* Three-Dot Menu */}
                                <ConversationHeaderMenu
                                    customerId={activeThread.customerId}
                                    customerName={activeThread.customerName || activeThread.customerPhone || "Customer"}
                                    customerPhone={activeThread.customerPhone}
                                    currentStatus={activeThread.conversationStatus || activeThread.status || "open"}
                                />
                            </div>
                        </div>

                        {/* WhatsApp 24-Hour Policy Notice Banner if outside active window */}
                        {isOutside24hWindow && (
                            <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-900 gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                                    <span className="text-[11px] leading-tight truncate">
                                        Outside 24-hour customer service window. WhatsApp requires an approved template message.
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] h-6 px-2.5 rounded-lg shrink-0 shadow-2xs"
                                >
                                    Select Template
                                </Button>
                            </div>
                        )}

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
                                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                                    <MessageSquare size={24} className="text-slate-200" />
                                    <p>No messages yet in this conversation.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 pb-2">
                                    {/* Initialization system log */}
                                    <div className="flex justify-center text-xs text-slate-500 font-medium py-1">
                                        <span className="bg-slate-100/80 px-3 py-1 rounded-full shadow-2xs text-[11px]">
                                            The chat has been initialized by contact {activeThread.customerName} ({activeThread.customerPhone})
                                        </span>
                                    </div>

                                    {/* Grouped Messages by Date Header */}
                                    {groupedMessages.map((group, gIdx) => (
                                        <div key={gIdx} className="space-y-3">
                                            {/* Friendly Date Separator Header */}
                                            <div className="flex justify-center py-1.5 shrink-0">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                                    {group.dateLabel}
                                                </span>
                                            </div>

                                            {/* Messages in Group */}
                                            {group.messages.map((conv, idx) => {
                                                const isInbound = conv.direction === "inbound";

                                                return (
                                                    <div key={conv.id || `msg-${idx}`} className="space-y-2">
                                                        {conv.intent === "automation_reply" && (
                                                            <div className="flex justify-center text-xs text-slate-400 font-medium py-0.5">
                                                                <span className="bg-slate-100 px-2.5 py-0.5 rounded-full shadow-2xs text-[10px]">
                                                                    Automated reply sent by Bot
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                                                            <div className={`flex flex-col max-w-[75%] ${isInbound ? "items-start" : "items-end"}`}>
                                                                {/* Bubble wrapper */}
                                                                <div
                                                                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-all border ${
                                                                        isInbound
                                                                            ? "bg-white text-slate-800 border-slate-200/80 rounded-tl-xs shadow-2xs"
                                                                            : "bg-[#eef6f5] text-slate-800 border-[#d3e8e5] rounded-tr-xs shadow-2xs"
                                                                    }`}
                                                                >
                                                                    {conv.message}
                                                                </div>

                                                                {/* Footer info inside bubbles */}
                                                                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] font-normal text-slate-500">
                                                                    {isInbound && (
                                                                        <span className="text-[#378179] font-semibold">{activeThread.customerName}</span>
                                                                    )}
                                                                    <span>{formatMessageTime(conv.createdAt)}</span>
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
                                                                                <span className="text-rose-500 font-bold text-[9px]">Failed</span>
                                                                            ) : (
                                                                                <Clock size={10} className="text-slate-400" />
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
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

                        {/* Composer Chat Input Area */}
                        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                            <form onSubmit={handleSendReply} className="space-y-2">
                                <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your message here or press '/' key for templates..."
                                    className="min-h-[46px] max-h-[120px] text-xs sm:text-sm resize-none py-2.5 px-3 border-transparent focus-visible:ring-0 rounded-xl bg-slate-50 focus:bg-white text-slate-800"
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendReply();
                                        }
                                    }}
                                />

                                <div className="flex items-center justify-between gap-3 flex-wrap pt-0.5">
                                    {/* Action toolbar buttons configured by Admin */}
                                    <div className="flex items-center gap-1 text-slate-400">
                                        {/* AI Copilot Dropdown */}
                                        {composerSettings.ai_copilot && (
                                            <CopilotDropdown
                                                currentText={replyText}
                                                onApplyText={(val) => setReplyText(val)}
                                                customerId={activeThread.customerId}
                                                settings={inboxConfig?.copilot}
                                            />
                                        )}

                                        {/* WhatsApp Templates Picker */}
                                        {composerSettings.templates && (
                                            <button
                                                type="button"
                                                onClick={() => setIsTemplatePickerOpen(true)}
                                                className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                                                title="Send WhatsApp Template"
                                            >
                                                <BookOpen size={14} />
                                            </button>
                                        )}

                                        {/* Quick Replies Picker */}
                                        {composerSettings.quick_replies && (
                                            <QuickReplyPicker
                                                onSelect={(content) => setReplyText((prev) => (prev ? `${prev} ${content}` : content))}
                                            />
                                        )}

                                        {/* Emoji Button */}
                                        {composerSettings.emoji && (
                                            <button
                                                type="button"
                                                onClick={() => setReplyText((prev) => prev + " 😊")}
                                                className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                                                title="Insert Emoji"
                                            >
                                                <Smile size={14} />
                                            </button>
                                        )}

                                        {/* Attachment Button */}
                                        {composerSettings.attachments && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    toast({
                                                        title: "Attachment Support",
                                                        description: "Select file or document to upload.",
                                                    });
                                                }}
                                                className="p-1.5 hover:text-slate-600 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                                                title="Attach File"
                                            >
                                                <Paperclip size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Send Trigger */}
                                    <Button
                                        type="submit"
                                        disabled={isSending || !replyText.trim()}
                                        className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs border-0 cursor-pointer"
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
                    /* No conversation selected empty state */
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center space-y-4">
                        <div className="text-[#378179] opacity-90">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">No conversation selected</h4>
                        <p className="max-w-xs leading-normal text-slate-500 text-xs">
                            Select a chat from the left panel or initiate a new conversation with a customer.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setIsNewConvOpen(true)}
                                className="bg-[#378179] hover:bg-[#2b625c] text-white font-bold text-xs rounded-lg h-8 px-3.5"
                            >
                                <Plus size={13} className="mr-1" /> New Message
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleTabChange("unread")}
                                className="border-[#378179] text-[#378179] hover:bg-[#378179]/05 rounded-lg text-xs font-semibold h-8"
                            >
                                View Unread Chats
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: New Conversation */}
            <NewConversationModal
                open={isNewConvOpen}
                onOpenChange={setIsNewConvOpen}
                onConversationCreated={(cid) => {
                    handleSelectThread(cid);
                }}
            />

            {/* Modal: WhatsApp Template Picker for active chat */}
            {activeThread && (
                <TemplatePickerModal
                    open={isTemplatePickerOpen}
                    onOpenChange={setIsTemplatePickerOpen}
                    recipientPhone={activeThread.customerPhone}
                    onTemplateSent={() => {
                        queryClient.invalidateQueries({ queryKey: ["getCustomerConversations", activeCustomerId] });
                        queryClient.invalidateQueries({ queryKey: ["listConversations"] });
                    }}
                />
            )}
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
